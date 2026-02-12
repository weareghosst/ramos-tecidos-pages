import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orderId = String(req.query.orderId || "");
    if (!orderId) return res.status(400).json({ error: "orderId ausente" });

    const { data, error } = await supabase
      .from("orders")
      .select("id,status,total_price,mp_payment_id,mp_status,paid_at,created_at")
      .eq("id", orderId)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, order: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
