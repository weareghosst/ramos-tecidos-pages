import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        customer_name,
        status,
        total_price,
        shipping_price,
        shipping_method,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin/orders error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      orders: data || [],
    });
  } catch (err: any) {
    console.error("admin/orders unexpected error:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}