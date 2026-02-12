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

// MP pode mandar em formatos diferentes. Vamos tentar extrair um paymentId de tudo.
function extractPaymentId(req: NextApiRequest, body: any) {
  // formato comum: { type: "payment", data: { id: "123" } }
  const fromBody = body?.data?.id || body?.id;
  if (fromBody) return String(fromBody);

  // alguns casos chegam via query: ?type=payment&data.id=123 / ?id=123
  const q: any = req.query || {};
  const fromQuery = q["data.id"] || q["data[id]"] || q["id"] || q["payment_id"];
  if (fromQuery) return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery);

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // MP chama POST
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MP_ACCESS_TOKEN = mustEnv("MERCADOPAGO_ACCESS_TOKEN");

    const body = req.body || {};
    const paymentId = extractPaymentId(req, body);

    if (!paymentId) {
      // responde 200 pra não ficar re-tentando sem parar
      console.warn("Webhook without paymentId:", body, req.query);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Busca o pagamento real no MP (isso é mais seguro do que confiar só no body do webhook)
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
      console.error("MP payment fetch failed:", mpRes.status, mp);
      return res.status(200).json({ ok: true, ignored: true });
    }

    const externalRef = mp?.external_reference; // deve ser seu orderId
    const status = mp?.status; // approved, pending, rejected, etc.
    const amount = Number(mp?.transaction_amount || 0);

    if (!externalRef) {
      console.warn("Payment without external_reference:", mp?.id);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Busca pedido no Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id,total_price,status")
      .eq("id", externalRef)
      .single();

    if (orderErr || !order) {
      console.warn("Order not found for external_reference:", externalRef, orderErr?.message);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Segurança: valida valor (tolerância de 1 centavo)
    const orderTotal = Number(order.total_price || 0);
    const diff = Math.abs(orderTotal - amount);

    if (orderTotal > 0 && amount > 0 && diff > 0.01) {
      console.error("Amount mismatch", { externalRef, orderTotal, amount, diff });
      // não marca pago se valor não bate
      await supabase
        .from("orders")
        .update({
          mp_payment_id: String(paymentId),
          mp_status: String(status),
          mp_raw: mp,
        })
        .eq("id", externalRef);

      return res.status(200).json({ ok: true, ignored: true, reason: "amount_mismatch" });
    }

    // Atualiza status conforme MP
    const isPaid = status === "approved";

    await supabase
      .from("orders")
      .update({
        status: isPaid ? "paid" : "pending",
        mp_payment_id: String(paymentId),
        mp_status: String(status),
        mp_raw: mp,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq("id", externalRef);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("webhook error:", e);
    // MP espera 200, mas 500 também faz ele tentar de novo.
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
