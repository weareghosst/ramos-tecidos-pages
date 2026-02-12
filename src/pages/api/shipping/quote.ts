import type { NextApiRequest, NextApiResponse } from "next";

type CartItem = {
  meters?: number;
  price_per_meter?: number;
};

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

// Regras simples (você ajusta depois):
function basePriceByUF(uf: string, city: string) {
  const UF = (uf || "").toUpperCase();
  const CITY = (city || "").toLowerCase();

  // São Paulo capital
  if (UF === "SP" && (CITY.includes("são paulo") || CITY.includes("sao paulo"))) {
    return { pac: 14.9, expresso: 24.9, pacDays: [2, 4], expDays: [1, 2] };
  }

  // SP interior
  if (UF === "SP") {
    return { pac: 19.9, expresso: 29.9, pacDays: [3, 5], expDays: [2, 3] };
  }

  // Sudeste/Sul
  const sudesteSul = ["RJ", "MG", "ES", "PR", "SC", "RS"];
  if (sudesteSul.includes(UF)) {
    return { pac: 29.9, expresso: 39.9, pacDays: [4, 7], expDays: [2, 4] };
  }

  // Demais estados
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

    if (!cepClean || cepClean.length !== 8) {
      return res.status(400).json({ error: "CEP inválido" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio para cotação" });
    }

    // 1) consulta ViaCEP
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const viaCep = await viaCepRes.json();
    if (!viaCepRes.ok || viaCep?.erro) {
      return res.status(400).json({ error: "CEP não encontrado" });
    }

    const uf = viaCep.uf as string;
    const city = viaCep.localidade as string;

    // 2) regra simples de preço/prazo
    const rules = basePriceByUF(uf, city);

    // 3) opcional: frete grátis acima de um valor (ajuste se quiser)
    const itemsTotal = calcItemsTotal(items);
    const freeShippingThreshold = 999999; // mude para 250 se quiser: 250
    const isFree = itemsTotal >= freeShippingThreshold;

    const options = [
      {
        id: "pac",
        label: "Entrega econômica",
        price: isFree ? 0 : money(rules.pac),
        days_min: rules.pacDays[0],
        days_max: rules.pacDays[1],
      },
      {
        id: "expresso",
        label: "Entrega expressa",
        price: isFree ? 0 : money(rules.expresso),
        days_min: rules.expDays[0],
        days_max: rules.expDays[1],
      },
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
      itemsTotal: money(itemsTotal),
      freeShippingApplied: isFree,
      options,
    });
  } catch (e: any) {
    console.error("shipping/quote error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
