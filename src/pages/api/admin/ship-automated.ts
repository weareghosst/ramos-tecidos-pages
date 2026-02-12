import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const BASE_URL =
  process.env.MELHOR_ENVIO_ENV === "production"
    ? "https://api.melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";

async function meFetch(path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Ramos Tecidos",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Erro Melhor Envio");
  return json;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { orderId } = req.body;
    if (!orderId) throw new Error("orderId obrigatório");

    // 1️⃣ Pedido + itens
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Pedido não encontrado");

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!items?.length) throw new Error("Pedido sem itens");

    // 2️⃣ Criar envio (cart)
    const cart = await meFetch("/v2/me/cart", {
      service: order.shipping_method,
      from: { postal_code: process.env.MELHOR_ENVIO_FROM_CEP },
      to: { postal_code: order.shipping_address.cep },
      products: items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        unitary_value: i.price / 100,
      })),
    });

    const shipmentId = cart.id;

    // 3️⃣ Comprar frete
    await meFetch("/v2/me/shipment/checkout", {
      shipments: [{ id: shipmentId }],
    });

    // 4️⃣ Gerar etiqueta
    const label = await meFetch("/v2/me/shipment/print", {
      shipments: [shipmentId],
    });

    const labelUrl = label?.url;

    // 5️⃣ Buscar rastreio
    const tracking = await meFetch(`/v2/me/shipment/tracking/${shipmentId}`);

    const trackingCode = tracking?.tracking;

    // 6️⃣ Atualiza pedido
    await supabase
      .from("orders")
      .update({
        shipped_at: new Date().toISOString(),
        tracking_code: trackingCode,
        shipping_provider: "Melhor Envio",
        label_url: labelUrl,
      })
      .eq("id", orderId);

    // 7️⃣ Email automático
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: order.email,
      subject: "Pedido enviado – Ramos Tecidos",
      html: `
        <p>Olá ${order.customer_name},</p>
        <p>Seu pedido foi enviado 🚚</p>
        <p><strong>Rastreio:</strong> ${trackingCode}</p>
        <p>
          <a href="${labelUrl}">Acompanhar envio</a>
        </p>
        <p>Obrigado por comprar na Ramos Tecidos ❤️</p>
      `,
    });

    res.json({
      success: true,
      trackingCode,
      labelUrl,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
