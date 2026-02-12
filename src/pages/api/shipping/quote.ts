import type { NextApiRequest, NextApiResponse } from "next";

type CartItem = {
  meters?: number;
  price_per_meter?: number;
  name?: string;
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

// fallback simples (se não tiver Melhor Envio)
function basePriceByUF(uf: string, city: string) {
  const UF = (uf || "").toUpperCase();
  const CITY = (city || "").toLowerCase();

  if (UF === "SP" && (CITY.includes("são paulo") || CITY.includes("sao paulo"))) {
    return { pac: 14.9, expresso: 24.9, pacDays: [2, 4], expDays: [1, 2] };
  }
  if (UF === "SP") return { pac: 19.9, expresso: 29.9, pacDays: [3, 5], expDays: [2, 3] };

  const sudesteSul = ["RJ", "MG", "ES", "PR", "SC", "RS"];
  if (sudesteSul.includes(UF)) return { pac: 29.9, expresso: 39.9, pacDays: [4, 7], expDays: [2, 4] };

  return { pac: 39.9, expresso: 59.9, pacDays: [6, 10], expDays: [3, 6] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { cep, items } = req.body || {};
    const cepClean = cleanCep(cep);

    if (!cepClean || cepClean.length !== 8) return res.status(400).json({ error: "CEP inválido" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Carrinho vazio para cotação" });

    // ViaCEP (pra preencher rua/bairro/cidade/UF)
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const viaCep = await viaCepRes.json();
    if (!viaCepRes.ok || viaCep?.erro) return res.status(400).json({ error: "CEP não encontrado" });

    const uf = String(viaCep.uf || "");
    const city = String(viaCep.localidade || "");

    const itemsTotal = money(calcItemsTotal(items));

    // --- Melhor Envio (se configurado) ---
    const ME_TOKEN = mustEnvOptional("MELHOR_ENVIO_TOKEN");
    const ME_ENV = (mustEnvOptional("MELHOR_ENVIO_ENV") || "sandbox").toLowerCase();
    const FROM_CEP = cleanCep(mustEnvOptional("MELHOR_ENVIO_FROM_CEP"));

    if (ME_TOKEN && FROM_CEP && FROM_CEP.length === 8) {
      const base = ME_ENV === "production"
        ? "https://www.melhorenvio.com.br"
        : "https://sandbox.melhorenvio.com.br";

      const weightPerMeter = Number(mustEnvOptional("WEIGHT_PER_METER_KG") || 0.2);
      const length = Number(mustEnvOptional("PKG_LENGTH_CM") || 30);
      const width = Number(mustEnvOptional("PKG_WIDTH_CM") || 20);
      const height = Number(mustEnvOptional("PKG_HEIGHT_CM") || 5);

      // transforma itens do carrinho em products (caso 1)
      const products = items.map((i: any, idx: number) => {
        const meters = Number(i.meters || 0);
        const ppm = Number(i.price_per_meter || 0);
        const insurance = money(meters * ppm);

        return {
          id: String(i.id || i.slug || idx + 1),
          name: String(i.name || "Produto"),
          quantity: 1,
          unitary_value: insurance,
          weight: money(Math.max(0.01, meters * weightPerMeter)), // kg
          length, // cm
          width,  // cm
          height, // cm
        };
      });

      const payload = {
        from: { postal_code: FROM_CEP },
        to: { postal_code: cepClean },
        products,
      };

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
      let meData: any = {};
      try {
        meData = meText ? JSON.parse(meText) : {};
      } catch {
        meData = { raw: meText };
      }

      if (meRes.ok && Array.isArray(meData)) {
        const options = meData
          .filter((q: any) => q?.price && q?.delivery_time)
          .map((q: any) => ({
            id: String(q.id), // id do serviço/cotação retornado
            label: `${q.company?.name || "Transportadora"} - ${q.name || "Serviço"}`,
            price: money(Number(q.custom_price ?? q.price) || 0),
            days_min: Number(q.custom_delivery_time ?? q.delivery_time) || 0,
            days_max: Number(q.custom_delivery_time ?? q.delivery_time) || 0,
            raw: q, // se quiser salvar no pedido depois
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
      }

      // se Melhor Envio falhar, cai no fallback
      console.warn("Melhor Envio quote failed:", meRes.status, meData);
    }

    // --- fallback simples ---
    const rules = basePriceByUF(uf, city);
    const options = [
      { id: "pac", label: "Entrega econômica", price: money(rules.pac), days_min: rules.pacDays[0], days_max: rules.pacDays[1] },
      { id: "expresso", label: "Entrega expressa", price: money(rules.expresso), days_min: rules.expDays[0], days_max: rules.expDays[1] },
    ];

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
      provider: "fallback",
      options,
    });
  } catch (e: any) {
    console.error("shipping/quote error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
