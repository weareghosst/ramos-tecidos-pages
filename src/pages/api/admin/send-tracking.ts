import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendTrackingEmail } from "@/lib/email/sendTrackingEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { orderId, trackingCode } = req.body as {
    orderId?: string;
    trackingCode?: string;
  };

  if (!orderId || !trackingCode?.trim()) {
    return res.status(400).json({ error: "orderId e trackingCode são obrigatórios" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_name, email, shipping_method")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }

  // salva o código de rastreio e atualiza status
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      tracking_code: trackingCode.trim(),
      shipping_status: "shipped",
      status: "shipped",
    })
    .eq("id", orderId);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // envia o e-mail
  await sendTrackingEmail({
    orderId,
    customerName: order.customer_name,
    email: order.email,
    trackingCode: trackingCode.trim(),
    shippingMethod: order.shipping_method || "Correios",
  });

  return res.status(200).json({ success: true });
}
