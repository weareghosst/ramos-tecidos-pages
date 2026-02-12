import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId, tracking_code, provider } = req.body;

  await supabase
    .from("orders")
    .update({
      tracking_code,
      shipping_provider: provider,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: order.email,
    subject: "Pedido enviado – Ramos Tecidos",
    html: `
      <p>Olá ${order.customer_name},</p>
      <p>Seu pedido foi enviado!</p>
      <p><strong>Código de rastreio:</strong> ${tracking_code}</p>
      <p>Transportadora: ${provider}</p>
    `,
  });

  res.json({ success: true });
}
