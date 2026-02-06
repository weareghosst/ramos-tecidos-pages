import type { NextApiRequest, NextApiResponse } from "next";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const MP_ACCESS_TOKEN = mustEnv("MERCADOPAGO_ACCESS_TOKEN");
    const BASE_URL = mustEnv("NEXT_PUBLIC_BASE_URL"); // ex: https://seuprojeto.vercel.app

    const { orderId, amount, payer } = req.body || {};

    if (!orderId) return res.status(400).json({ error: "orderId ausente" });

    const transaction_amount = Number(amount);
    if (!transaction_amount || Number.isNaN(transaction_amount) || transaction_amount <= 0) {
      return res.status(400).json({ error: "amount inválido" });
    }

    if (!payer?.email) return res.status(400).json({ error: "payer.email ausente" });
    if (!payer?.first_name) return res.status(400).json({ error: "payer.first_name ausente" });
    if (!payer?.last_name) return res.status(400).json({ error: "payer.last_name ausente" });

    // URL do webhook precisa ser URL válida (HTTPS em produção)
    const notification_url = `${BASE_URL.replace(/\/$/, "")}/api/mercadopago/webhook`;

    const body = {
      transaction_amount,
      description: `Pedido Ramos Tecidos ${orderId}`,
      payment_method_id: "pix",
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
        identification: payer.identification
          ? {
              type: payer.identification.type || "CPF",
              number: payer.identification.number,
            }
          : undefined,
      },
      notification_url,
      external_reference: orderId,
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
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
      console.error("Mercado Pago error:", mpRes.status, data);
      return res.status(mpRes.status).json({
        error: "Mercado Pago error",
        status: mpRes.status,
        details: data,
        sent: body,
      });
    }

    // Pega o QR e o código copia e cola
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
