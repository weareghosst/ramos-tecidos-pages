import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPayment(paymentId: string) {
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Segurança simples por token na URL
  const token = String(req.query.token || "");
  if (token !== process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // MP manda payloads diferentes; aqui pegamos os IDs mais comuns
  const paymentId = String(req.body?.data?.id || req.body?.id || "");
  if (!paymentId) return res.status(200).json({ ok: true });

  try {
    const payment = await getPayment(paymentId);
    const orderId = String(payment.external_reference || "");
    const mpStatus = String(payment.status || "");

    if (!orderId) return res.status(200).json({ ok: true });

    const newStatus = mpStatus === "approved" ? "paid" : "pending";

    await supabase
      .from("orders")
      .update({
        status: newStatus,
        mp_payment_id: String(payment.id),
        mp_status: mpStatus
      })
      .eq("id", orderId);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    // Retorna 200 pra evitar retry infinito em dev
    return res.status(200).json({ ok: false, error: e?.message || "error" });
  }
}
