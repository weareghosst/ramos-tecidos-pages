import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customer, items } = req.body;

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ error: "Dados do cliente incompletos" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Carrinho vazio" });
  }

  let total = 0;

  for (const item of items) {
    total += item.pricePerMeter * item.meters;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      total_price: total,
      status: "pending"
    })
    .select()
    .single();

  if (error || !order) {
    return res.status(500).json({ error: "Erro ao criar pedido" });
  }

  const orderItems = items.map((i: any) => ({
    order_id: order.id,
    product_id: i.productId,
    meters: i.meters,
    price_per_meter: i.pricePerMeter
  }));

  await supabase.from("order_items").insert(orderItems);

  return res.status(200).json({
    orderId: order.id,
    total
  });
}
