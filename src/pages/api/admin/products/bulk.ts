import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toSafeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type BulkProduct = {
  name: string;
  price_per_meter: number;
  fabric_type: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { products } = req.body as { products: BulkProduct[] };

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Nenhum produto enviado" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const p of products) {
    if (!p.name?.trim()) {
      results.push({ name: p.name || "(sem nome)", success: false, error: "Nome vazio" });
      continue;
    }

    const baseSlug = slugify(p.name);

    // garante slug único adicionando sufixo se necessário
    let slug = baseSlug;
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const { error } = await supabase.from("products").insert({
      name: p.name.trim(),
      slug,
      description: null,
      price_per_meter: toSafeNumber(p.price_per_meter),
      stock_meters: 0,
      image_url: null,
      fabric_type: p.fabric_type || null,
      active: true,
    });

    if (error) {
      results.push({ name: p.name, success: false, error: error.message });
    } else {
      results.push({ name: p.name, success: true });
    }
  }

  const totalSuccess = results.filter((r) => r.success).length;
  const totalError = results.filter((r) => !r.success).length;

  return res.status(200).json({ results, totalSuccess, totalError });
}
