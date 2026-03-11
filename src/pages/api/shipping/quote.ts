import type { NextApiRequest, NextApiResponse } from "next";

type CartItem = {
  meters?: number;
  price_per_meter?: number;
  name?: string;
  id?: string;
  slug?: string;
};

function mustEnvOptional(name: string) {
  return process.env[name] || "";
}

function cleanCep(cep: string) {
  return String(cep || "").replace(/\D/g, "").slice(0, 8);
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function calcItemsTotal(items: CartItem[]) {
  return (items || []).reduce((acc, i) => {
    const meters = Number(i.meters || 0);
    const ppm = Number(i.price_per_meter || 0);
    return acc + meters * ppm;
  }, 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { cep, items } = req.body || {};
    const cepClean = cleanCep(cep);

    if (!cepClean || cepClean.length !== 8)
      return res.status(400).json({ error: "CEP inválido" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Carrinho vazio para cotação" });

    // ViaCEP
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
    const viaCep = await viaCepRes.json();
    if (!viaCepRes.ok || viaCep?.erro)
      return res.status(400).json({ error: "CEP não encontrado" });

    const itemsTotal = money(calcItemsTotal(items));

    // --- variáveis de ambiente (aceita os dois nomes) ---
    const ME_TOKEN =
      mustEnvOptional("MELHOR_ENVIO_TOKEN");
    const FROM_CEP =
      cleanCep(mustEnvOptional("ME_FROM_CEP") || mustEnvOptional("MELHOR_ENVIO_FROM_CEP"));
    const isSandbox =
      String(process.env.MELHOR_ENVIO_SANDBOX || "true").toLowerCase() === "true";

    const base = isSandbox
      ? "https://sandbox.melhorenvio.com.br"
      : "https://www.melhorenvio.com.br";

    if (ME_TOKEN && FROM_CEP && FROM_CEP.length === 8) {
      const weightPerMeter = Number(mustEnvOptional("WEIGHT_PER_METER_KG") || 0.2);
      const length = Number(mustEnvOptional("PKG_LENGTH_CM") || 30);
      const width = Number(mustEnvOptional("PKG_WIDTH_CM") || 20);
      const height = Number(mustEnvOptional("PKG_HEIGHT_CM") || 5);

      const products = items.map((i: any, idx: number) => {
        const meters = Number(i.meters || 0);
        const ppm = Number(i.price_per_meter || 0);
        const insurance = money(meters * ppm);

        return {
          id: String(i.id || i.slug || idx + 1),
          name: String(i.name || "Tecido"),
          quantity: 1,
          unitary_value: insurance,
          weight: money(Math.max(0.1, meters * weightPerMeter)),
          length,
          width,
          height,
        };
      });

      const payload = {
        from: { postal_code: FROM_CEP },
        to: { postal_code: cepClean },
        products,
        options: {
          insurance_value: itemsTotal,
          receipt: false,
          own_hand: false,
        },
      };

      console.log("[quote] Chamando Melhor Envio:", base, JSON.stringify(payload));

      const meRes = await fetch(`${base}/api/v2/me/shipment/calculate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${ME_TOKEN}`,
          "User-Agent": "RamosTecidos/1.0",
        },
        body: JSON.stringify(payload),
      });

      const meText = await meRes.text();
      console.log("[quote] Resposta Melhor Envio status:", meRes.status);
      console.log("[quote] Resposta Melhor Envio body:", meText.slice(0, 500));

      let meData: any = {};
      try {
        meData = meText ? JSON.parse(meText) : {};
      } catch {
        meData = { raw: meText };
      }

      if (meRes.ok && Array.isArray(meData)) {
        const options = meData
          .filter((q: any) => q?.price && !q?.error && q?.delivery_time)
          .map((q: any) => ({
            id: Number(q.id), // número inteiro para o Melhor Envio aceitar depois
            label: `${q.company?.name || "Transportadora"} - ${q.name || "Serviço"}`,
            price: money(Number(q.custom_price ?? q.price) || 0),
            days_min: Number(q.custom_delivery_time ?? q.delivery_time) || 0,
            days_max: Number(q.custom_delivery_time ?? q.delivery_time) || 0,
          }));

        if (options.length) {
          return res.status(200).json({
            ok: true,
            cep: cepClean,
            address: {
              cep: viaCep.cep,
              street: viaCep.logradouro,
              district: viaCep.bairro,
              city: viaCep.localidade,
              state: viaCep.uf,
            },
            itemsTotal,
            provider: "melhorenvio",
            options,
          });
        }

        // cotações vieram mas todas com erro
        const erros = meData
          .filter((q: any) => q?.error)
          .map((q: any) => `${q.name}: ${q.error}`)
          .join("; ");

        console.warn("[quote] Melhor Envio sem opções válidas. Erros:", erros);

        return res.status(200).json({
          ok: false,
          error: `Nenhuma opção de frete disponível para este CEP. ${erros}`,
        });
      }

      console.warn("[quote] Melhor Envio retornou erro:", meRes.status, meData);

      return res.status(200).json({
        ok: false,
        error: "Erro ao consultar fretes. Tente novamente.",
        debug: meData,
      });
    }

    // sem token/CEP configurado
    console.warn("[quote] MELHOR_ENVIO_TOKEN ou FROM_CEP não configurados");
    return res.status(500).json({
      error: "Serviço de frete não configurado. Configure MELHOR_ENVIO_TOKEN e ME_FROM_CEP.",
    });

  } catch (e: any) {
    console.error("shipping/quote error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}