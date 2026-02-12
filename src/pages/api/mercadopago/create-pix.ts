import type { NextApiRequest, NextApiResponse } from "next";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function isHttpsUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MP_ACCESS_TOKEN = mustEnv("MERCADOPAGO_ACCESS_TOKEN");
    const BASE_URL = mustEnv("NEXT_PUBLIC_BASE_URL"); // ex: https://ramos-tecidos-pages-g99k.vercel.app

    if (!isHttpsUrl(BASE_URL)) {
      return res.status(500).json({
        error: "NEXT_PUBLIC_BASE_URL inválida (precisa ser https://...)",
        got: BASE_URL,
      });
    }

    const { orderId, amount, payer } = req.body || {};

    if (!orderId) return res.status(400).json({ error: "orderId ausente" });

    const transaction_amount_raw = Number(amount);
    if (!transaction_amount_raw || Number.isNaN(transaction_amount_raw) || transaction_amount_raw <= 0) {
      return res.status(400).json({ error: "amount inválido", got: amount });
    }

    // Mercado Pago costuma gostar de 2 casas
    const transaction_amount = Math.round(transaction_amount_raw * 100) / 100;

    if (!payer?.email) return res.status(400).json({ error: "payer.email ausente" });
    if (!payer?.first_name) return res.status(400).json({ error: "payer.first_name ausente" });
    if (!payer?.last_name) return res.status(400).json({ error: "payer.last_name ausente" });

    const notification_url = `${BASE_URL.replace(/\/$/, "")}/api/mercadopago/webhook`;

    const identificationNumber =
      payer?.identification?.number ? String(payer.identification.number).replace(/\D/g, "") : "";

    const body: any = {
      transaction_amount,
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

    // só envia identification se tiver número
    if (identificationNumber) {
      body.payer.identification = {
        type: payer?.identification?.type || "CPF",
        number: identificationNumber,
      };
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        // evita criar 2 pagamentos caso o usuário clique 2x / retry
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

    if (!mpRes.ok) {
      // deixa o erro mais “legível”
      const mpMessage = data?.message || data?.error || "Mercado Pago error";
      const causes = data?.cause || data?.causes || null;

      console.error("Mercado Pago error:", mpRes.status, data);

      return res.status(mpRes.status).json({
        error: "Mercado Pago error",
        status: mpRes.status,
        mp_message: mpMessage,
        causes,
        details: data,
        sent: body,
      });
    }

    const qr = data?.point_of_interaction?.transaction_data?.qr_code_base64;
    const copiaECola = data?.point_of_interaction?.transaction_data?.qr_code;
    const paymentId = data?.id;

    return res.status(200).json({
      ok: true,
      orderId,
      paymentId,
      qr_code_base64: qr,
      qr_code: copiaECola,
      status: data?.status,
    });
  } catch (e: any) {
    console.error("create-pix API error:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
