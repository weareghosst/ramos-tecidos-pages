import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

// Extrai paymentId dos formatos mais comuns do Mercado Pago
function extractPaymentId(req: NextApiRequest, body: any) {
  const fromBody = body?.data?.id || body?.id;
  if (fromBody) return String(fromBody);

  const q: any = req.query || {};
  const fromQuery = q["data.id"] || q["data[id]"] || q["id"] || q["payment_id"];
  if (fromQuery) return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MP_ACCESS_TOKEN = mustEnv("MERCADOPAGO_ACCESS_TOKEN");

    const body = req.body || {};
    const paymentId = extractPaymentId(req, body);

    // Se não veio paymentId, responde 200 pra evitar retries infinitos
    if (!paymentId) {
      console.warn("MP webhook: no paymentId", { body, query: req.query });
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Busca pagamento real no MP (mais seguro do que confiar só no webhook)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const mpText = await mpRes.text();
    let mp: any = {};
    try {
      mp = mpText ? JSON.parse(mpText) : {};
    } catch {
      mp = { raw: mpText };
    }

    if (!mpRes.ok) {
      console.error("MP webhook: failed to fetch payment", mpRes.status, mp);
      return res.status(200).json({ ok: true, ignored: true });
    }

    const orderId = mp?.external_reference; // seu orderId
    const status = String(mp?.status || "unknown"); // approved/pending/rejected...
    const amount = Number(mp?.transaction_amount || 0);

    if (!orderId) {
      console.warn("MP webhook: payment without external_reference", { paymentId, status });
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Busca pedido no Supabase para validar
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id,total_price,status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.warn("MP webhook: order not found", { orderId, orderErr: orderErr?.message });
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Segurança: valor do pagamento bate com total do pedido
    const orderTotal = Number(order.total_price || 0);
    const diff = Math.abs(orderTotal - amount);

    // Se o MP retornou amount 0 por algum motivo, não trava; mas se ambos >0 e dif>1 centavo, não marca como paid
   const FORCE_TEST_AMOUNT = process.env.FORCE_TEST_AMOUNT;

// Só bloqueia mismatch se NÃO estiver em modo teste
if (!FORCE_TEST_AMOUNT && orderTotal > 0 && amount > 0 && diff > 0.01) {
  console.error("MP webhook: amount mismatch", { orderId, orderTotal, amount, diff });

  await supabase
    .from("orders")
    .update({
      mp_payment_id: String(paymentId),
      mp_status: status,
      mp_raw: mp,
    })
    .eq("id", orderId);

  return res.status(200).json({ ok: true, ignored: true, reason: "amount_mismatch" });
}



    const isPaid = status === "approved";

    await supabase
      .from("orders")
      .update({
        status: isPaid ? "paid" : "pending",
        mp_payment_id: String(paymentId),
        mp_status: status,
        mp_raw: mp,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq("id", orderId);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("MP webhook error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
