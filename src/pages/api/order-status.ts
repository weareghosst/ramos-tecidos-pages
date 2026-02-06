import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orderId = String(req.query.orderId || "");
  if (!orderId) return res.status(400).json({ error: "orderId ausente" });

  const { data, error } = await supabase
    .from("orders")
    .select("status, mp_status")
    .eq("id", orderId)
    .single();

  if (error || !data) return res.status(404).json({ error: "Pedido não encontrado" });
  return res.status(200).json(data);
}
