import type { NextApiRequest, NextApiResponse } from "next";

function mustEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function optEnv(name: string) {
  return process.env[name] || "";
}

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\r?\n|\r/g, "").replace(/\/$/, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MP_ACCESS_TOKEN = mustEnv("MERCADOPAGO_ACCESS_TOKEN");
    const BASE_URL = normalizeBaseUrl(mustEnv("NEXT_PUBLIC_BASE_URL"));

    if (!BASE_URL.startsWith("https://")) {
      return res.status(500).json({
        error: "NEXT_PUBLIC_BASE_URL precisa começar com https://",
        got: BASE_URL,
      });
    }

    const { orderId, amount, payer } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: "orderId ausente" });
    }

    const FORCE_TEST_AMOUNT = optEnv("FORCE_TEST_AMOUNT");
    const transaction_amount = FORCE_TEST_AMOUNT
      ? Number(FORCE_TEST_AMOUNT)
      : Number(amount);

    if (!transaction_amount || Number.isNaN(transaction_amount) || transaction_amount <= 0) {
      return res.status(400).json({
        error: "amount inválido",
        got: amount,
        forced: FORCE_TEST_AMOUNT || null,
      });
    }

    if (!payer?.email) {
      return res.status(400).json({ error: "payer.email ausente" });
    }

    if (!payer?.first_name) {
      return res.status(400).json({ error: "payer.first_name ausente" });
    }

    if (!payer?.last_name) {
      return res.status(400).json({ error: "payer.last_name ausente" });
    }

    const notification_url = `${BASE_URL}/api/mercadopago/webhook`;

    const body = {
      transaction_amount: Math.round(transaction_amount * 100) / 100,
      description: `Pedido Ramos Tecidos ${orderId}`,
      payment_method_id: "pix",
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
      },
      notification_url,
      external_reference: orderId,
    };

    console.log("💳 Creating PIX payment");
    console.log("🌐 BASE_URL:", BASE_URL);
    console.log("🔔 notification_url:", notification_url);
    console.log("📦 Payload sent to Mercado Pago:", body);

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": String(orderId),
      },
      body: JSON.stringify(body),
    });

    const text = await mpRes.text();

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log("📨 Mercado Pago response status:", mpRes.status);
    console.log("📨 Mercado Pago response body:", data);

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        error: "Mercado Pago error",
        status: mpRes.status,
        mp_message: data?.message || data?.error || "MP error",
        details: data,
        sent: body,
      });
    }

    const qr = data?.point_of_interaction?.transaction_data?.qr_code_base64;
    const copiaECola = data?.point_of_interaction?.transaction_data?.qr_code;

    return res.status(200).json({
      ok: true,
      orderId,
      paymentId: data?.id,
      qr_code_base64: qr,
      qr_code: copiaECola,
      status: data?.status,
      forced_amount: FORCE_TEST_AMOUNT ? body.transaction_amount : null,
      notification_url,
    });
  } catch (e: any) {
    console.error("create-pix API error:", e);
    return res.status(500).json({
      error: e?.message || "Internal error",
    });
  }
}