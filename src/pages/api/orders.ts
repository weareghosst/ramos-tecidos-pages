import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Item = {
  product_id?: string; // UUID (se existir)
  id?: string | number;
  slug?: string;
  name?: string;
  meters: number;
  price_per_meter: number;
};

function isUuid(v: any) {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { customer, items, shipping_address, shipping_price, shipping_method } = req.body || {};

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: "Customer inválido" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    // validação mínima do endereço
    if (
      !shipping_address?.cep ||
      !shipping_address?.street ||
      !shipping_address?.number ||
      !shipping_address?.district ||
      !shipping_address?.city ||
      !shipping_address?.state
    ) {
      return res
        .status(400)
        .json({ error: "Endereço inválido (preencha CEP, rua, número, bairro, cidade e UF)" });
    }

    const safeItems: Item[] = items.map((i: any) => ({
      product_id: i.product_id,
      id: i.id,
      slug: i.slug,
      name: i.name,
      meters: Number(i.meters || 0),
      price_per_meter: Number(i.price_per_meter || 0),
    }));

    const itemsTotal = safeItems.reduce((acc, i) => acc + i.meters * i.price_per_meter, 0);

    const shippingPriceNum = Number(shipping_price || 0);
    if (Number.isNaN(shippingPriceNum) || shippingPriceNum < 0) {
      return res.status(400).json({ error: "shipping_price inválido" });
    }

    if (!shipping_method) {
      return res.status(400).json({ error: "shipping_method ausente" });
    }

    const total = itemsTotal + shippingPriceNum;

    // 1) cria pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        total_price: total,

        shipping_address,
        shipping_price: shippingPriceNum,
        shipping_method,
        shipping_status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("orders insert error:", orderError);
      return res.status(500).json({ error: orderError.message });
    }

    // 2) cria itens
    const orderId = order.id;

    const orderItemsPayload = safeItems.map((i) => ({
      order_id: orderId,
      product_id: isUuid(i.product_id) ? i.product_id : null,
      meters: i.meters,
      price_per_meter: i.price_per_meter,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);

    if (itemsError) {
      console.error("order_items insert error:", itemsError);
      return res.status(500).json({ error: itemsError.message });
    }

    return res.status(200).json({ orderId });
  } catch (e: any) {
    console.error("orders API error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
