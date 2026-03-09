import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type CheckoutItem = {
  product_id: string;
  meters: number;
  price_per_meter: number;
  variant_id?: string | null;
  color_name?: string | null;
};

type RequestBody = {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: CheckoutItem[];
  shipping_address: {
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    district: string;
    city: string;
    state: string;
  };
  shipping_price?: number;
  shipping_method?: string | null;
  melhor_envio_service_id?: string | number | null;
};

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

function isValidItems(items: unknown): items is CheckoutItem[] {
  return (
    Array.isArray(items) &&
    items.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as CheckoutItem).product_id === "string" &&
        typeof (item as CheckoutItem).meters === "number" &&
        typeof (item as CheckoutItem).price_per_meter === "number"
    )
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body as RequestBody;

    const customer = body?.customer;
    const items = body?.items;
    const shippingAddress = body?.shipping_address;
    const shippingPrice = Number(body?.shipping_price || 0);
    const shippingMethod = body?.shipping_method || null;

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: "Dados do cliente incompletos" });
    }

    if (!isValidItems(items) || items.length === 0) {
      return res.status(400).json({ error: "Itens inválidos" });
    }

    if (
      !shippingAddress?.cep ||
      !shippingAddress?.street ||
      !shippingAddress?.number ||
      !shippingAddress?.district ||
      !shippingAddress?.city ||
      !shippingAddress?.state
    ) {
      return res.status(400).json({ error: "Endereço incompleto" });
    }

    const itemsTotal = items.reduce((acc, item) => {
      return acc + Number(item.meters || 0) * Number(item.price_per_meter || 0);
    }, 0);

    const totalPrice = Number((itemsTotal + shippingPrice).toFixed(2));

    const shippingAddressJson = {
      cep: shippingAddress.cep,
      street: shippingAddress.street,
      number: shippingAddress.number,
      complement: shippingAddress.complement || null,
      district: shippingAddress.district,
      city: shippingAddress.city,
      state: shippingAddress.state,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        total_price: totalPrice,
        status: "pending",
        shipping_address: shippingAddressJson,
        shipping_price: shippingPrice,
        shipping_method: shippingMethod,
        shipping_status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("orders insert error:", orderError);
      return res.status(500).json({
        error: orderError?.message || "Erro ao criar pedido",
      });
    }

    const orderItemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      color_name: item.color_name || null,
      meters: Number(item.meters),
      price_per_meter: Number(item.price_per_meter),
      price: Number(
        (Number(item.meters) * Number(item.price_per_meter)).toFixed(2)
      ),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error("order_items insert error:", itemsError);

      await supabase.from("orders").delete().eq("id", order.id);

      return res.status(500).json({
        error: itemsError.message || "Erro ao salvar itens do pedido",
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
    });
  } catch (err: any) {
    console.error("orders unexpected error:", err);
    return res.status(500).json({
      error: err?.message || "Erro interno",
    });
  }
}