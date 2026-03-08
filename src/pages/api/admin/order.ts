import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ error: "orderId é obrigatório" });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          image_url
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      return res.status(500).json({ error: itemsError.message });
    }

    const normalizedItems = (items || []).map((item: any) => ({
      ...item,
      product_name:
        item.product_name ||
        item.product?.name ||
        "Produto",
      quantity:
        item.quantity ??
        item.meters ??
        0,
      line_total:
        Number(item.meters || 0) * Number(item.price_per_meter || 0),
    }));

    return res.status(200).json({
      order: {
        ...order,
        items: normalizedItems,
      },
    });
  } catch (err: any) {
    console.error("admin/order error:", err);
    return res.status(500).json({ error: err?.message || "Erro interno" });
  }
}