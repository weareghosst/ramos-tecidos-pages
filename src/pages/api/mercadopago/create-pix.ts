import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { orderId } = req.body as { orderId?: string };
    if (!orderId) return res.status(400).json({ error: "orderId ausente" });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    if (!baseUrl) return res.status(500).json({ error: "NEXT_PUBLIC_BASE_URL não configurada na Vercel" });

    const notificationUrl = `${baseUrl}/api/mercadopago/webhook?token=${process.env.MERCADOPAGO_WEBHOOK_SECRET}`;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id,total_price,email,status,mp_payment_id")
      .eq("id", orderId)
      .single();

    if (oErr || !order) return res.status(404).json({ error: "Pedido não encontrado" });
    if (order.status !== "pending") return res.status(400).json({ error: "Pedido não está pendente" });
    if (order.mp_payment_id) return res.status(400).json({ error: "Pix já foi gerado para este pedido" });

    const mpResp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id
      },
      body: JSON.stringify({
        transaction_amount: Number(order.total_price),
        description: `Pedido ${order.id} - RAMOS TECIDOS`,
        payment_method_id: "pix",
        payer: { email: order.email },
        external_reference: order.id,
        notification_url: notificationUrl
      })
    });

    const raw = await mpResp.text();
    let payment: any = null;
    try { payment = JSON.parse(raw); } catch { /* ignore */ }

    if (!mpResp.ok) {
      return res.status(500).json({ error: "Mercado Pago erro", details: payment || raw });
    }

    const qrCodeCopyPaste = payment?.point_of_interaction?.transaction_data?.qr_code ?? null;
    const qrCodeBase64 = payment?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

    await supabase
      .from("orders")
      .update({
        mp_payment_id: String(payment.id),
        mp_status: String(payment.status)
      })
      .eq("id", order.id);

     console.log("BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
     console.log("NOTIFICATION_URL:", notificationUrl);

    return res.status(200).json({
      mpPaymentId: String(payment.id),
      status: String(payment.status),
      qrCodeCopyPaste,
      qrCodeBase64
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}
