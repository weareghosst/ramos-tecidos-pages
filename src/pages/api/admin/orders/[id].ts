import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ error: "ID obrigatório" });

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // deletar itens do pedido primeiro
  await supabase.from("order_items").delete().eq("order_id", id);

  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}
