import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Item = {
  product_id?: string; // se você tiver UUID no supabase
  id?: string;
  slug?: string;
  name?: string;
  meters: number;
  price_per_meter: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { customer, items } = req.body || {};

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: "Customer inválido" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const safeItems: Item[] = items.map((i: any) => ({
      product_id: i.product_id,
      id: i.id,
      slug: i.slug,
      name: i.name,
      meters: Number(i.meters || 0),
      price_per_meter: Number(i.price_per_meter || 0),
    }));

    const total = safeItems.reduce((acc, i) => acc + i.meters * i.price_per_meter, 0);

    // 1) cria pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        total_price: total,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("orders insert error:", orderError);
      return res.status(500).json({ error: orderError.message });
    }

    // 2) cria itens do pedido (se sua tabela order_items existe)
    const orderId = order.id;

    const orderItemsPayload = safeItems.map((i) => ({
      order_id: orderId,
      // se sua tabela pede product_id UUID, mande i.product_id (ou i.id se for UUID)
      product_id: i.product_id || i.id || null,
      meters: i.meters,
      price_per_meter: i.price_per_meter,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);

    if (itemsError) {
      console.error("order_items insert error:", itemsError);
      // Se falhar itens, você pode optar por apagar o pedido, mas por enquanto só retorna erro
      return res.status(500).json({ error: itemsError.message });
    }

    return res.status(200).json({ orderId });
  } catch (e: any) {
    console.error("orders API error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
