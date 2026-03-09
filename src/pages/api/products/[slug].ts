import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Slug inválido" });
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price_per_meter,
        stock_meters,
        image_url,
        active,
        created_at,
        variants:product_variants(
          id,
          product_id,
          color_name,
          color_hex,
          image_url,
          stock_meters,
          active,
          created_at
        )
      `)
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({ product: null });
    }

    return res.status(200).json({ product: data });
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}