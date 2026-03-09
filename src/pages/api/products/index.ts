import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const search = String(req.query.search || "").trim();
    const type = String(req.query.type || "").trim();

    let query = supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (type) {
      query = query.eq("fabric_type", type);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,fabric_type.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ products: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
}