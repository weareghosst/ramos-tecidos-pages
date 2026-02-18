import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ products: data });
  }

  if (req.method === "POST") {
  const {
    name,
    slug,
    description,
    price_per_meter,
    stock_meters,
    active,
    image_url,
  } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name,
        slug,
        description,
        price_per_meter,
        stock_meters,
        active,
        image_url,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ product: data });
}

}
