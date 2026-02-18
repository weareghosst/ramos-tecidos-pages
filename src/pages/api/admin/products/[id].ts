import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ product: data });
  }

  if (req.method === "PUT") {
    const {
      name,
      slug,
      description,
      price_per_meter,
      stock_meters,
      active,
      image_url,
    } = req.body;

    const { error } = await supabase
      .from("products")
      .update({
        name,
        slug,
        description,
        price_per_meter,
        stock_meters,
        active,
        image_url,
      })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
