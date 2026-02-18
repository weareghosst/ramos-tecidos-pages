import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

function asNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickShippingServiceId(order: any) {
  return (
    order?.melhor_envio_service_id ??
    order?.shipping_service_id ??
    order?.service_id ??
    null
  );
}

function getBaseUrl() {
  // Se você usa sandbox por enquanto:
  // MELHOR_ENVIO_SANDBOX=true -> sandbox
  const isSandbox =
    String(process.env.MELHOR_ENVIO_SANDBOX || "true").toLowerCase() === "true";

  return isSandbox
    ? "https://sandbox.melhorenvio.com.br/api"
    : "https://melhorenvio.com.br/api";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId } = req.body as { orderId?: string };

    if (!orderId) {
      return res.status(400).json({ error: "orderId é obrigatório" });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    const serviceId = pickShippingServiceId(order);
    if (!serviceId) {
      return res.status(400).json({
        error:
          "Pedido sem service_id do Melhor Envio. Salve o serviço escolhido no checkout (ex: melhor_envio_service_id).",
      });
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "MELHOR_ENVIO_TOKEN não configurado" });
    }

    // Dados do destinatário (ajuste os nomes conforme seu schema real)
    const to = {
      name: order.customer_name ?? order.name ?? "Cliente",
      phone: order.phone ?? order.customer_phone ?? "",
      email: order.email ?? "",
      address: order.address ?? order.street ?? "",
      number: order.number ?? order.address_number ?? "",
      district: order.district ?? order.neighborhood ?? "",
      city: order.city ?? "",
      state_abbr: order.state ?? order.uf ?? "",
      postal_code: (order.cep ?? order.postal_code ?? "").replace(/\D/g, ""),
    };

    // Origem (loja) — coloque seus dados reais (sandbox aceita, mas produção precisa estar ok)
    const from = {
      name: process.env.ME_FROM_NAME || "Ramos Tecidos",
      phone: process.env.ME_FROM_PHONE || "11999999999",
      email: process.env.ME_FROM_EMAIL || "contato@ramostecidos.com.br",
      document: process.env.ME_FROM_DOCUMENT || "00000000000",
      company_document: process.env.ME_FROM_COMPANY_DOCUMENT || "00000000000000",
      state_register: process.env.ME_FROM_STATE_REGISTER || "",
      address: process.env.ME_FROM_ADDRESS || "Rua Exemplo",
      number: process.env.ME_FROM_NUMBER || "123",
      district: process.env.ME_FROM_DISTRICT || "Centro",
      city: process.env.ME_FROM_CITY || "São Paulo",
      state_abbr: process.env.ME_FROM_STATE || "SP",
      postal_code: (process.env.ME_FROM_CEP || "00000000").replace(/\D/g, ""),
    };

    // Pacote mínimo (coloque dimensões reais depois)
    const pkg = {
      weight: asNumber(order.package_weight, 0.3),
      width: asNumber(order.package_width, 11),
      height: asNumber(order.package_height, 2),
      length: asNumber(order.package_length, 16),
    };

    const insuranceValue = asNumber(order.total, 0);

    // Produto genérico (se quiser, depois a gente manda os itens reais)
    const products = [
      {
        name: `Pedido ${order.id}`,
        quantity: 1,
        unitary_value: insuranceValue,
        weight: pkg.weight,
        width: pkg.width,
        height: pkg.height,
        length: pkg.length,
      },
    ];

    const baseUrl = getBaseUrl();

    // 1) CRIAR CARRINHO
    const cartResp = await fetch(`${baseUrl}/v2/me/cart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "RamosTecidos/1.0",
      },
      body: JSON.stringify({
        service: serviceId,
        agency: order.melhor_envio_agency_id ?? undefined, // opcional
        from,
        to,
        products,
        volumes: [
          {
            height: pkg.height,
            width: pkg.width,
            length: pkg.length,
            weight: pkg.weight,
          },
        ],
        insurance_value: insuranceValue,
      }),
    });

    const cartText = await cartResp.text();
    let cartData: any = null;
    try {
      cartData = JSON.parse(cartText);
    } catch {
      cartData = { raw: cartText };
    }

    if (!cartResp.ok) {
      return res.status(500).json({
        error: "Erro ao criar carrinho",
        melhorEnvio: cartData,
        status: cartResp.status,
      });
    }

    const cartId = cartData?.id;
    if (!cartId) {
      return res.status(500).json({
        error: "Carrinho criado mas sem id retornado",
        melhorEnvio: cartData,
      });
    }

    // 2) CHECKOUT (GERAR ETIQUETA)
    const checkoutResp = await fetch(`${baseUrl}/v2/me/shipment/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "RamosTecidos/1.0",
      },
      body: JSON.stringify({ orders: [cartId] }),
    });

    const checkoutText = await checkoutResp.text();
    let checkoutData: any = null;
    try {
      checkoutData = JSON.parse(checkoutText);
    } catch {
      checkoutData = { raw: checkoutText };
    }

    if (!checkoutResp.ok) {
      return res.status(500).json({
        error: "Erro no checkout",
        melhorEnvio: checkoutData,
        status: checkoutResp.status,
      });
    }

    // Atualiza pedido como shipped + salva ids do Melhor Envio para rastrear
    await supabase
      .from("orders")
      .update({
        status: "shipped",
        melhor_envio_cart_id: cartId,
        melhor_envio_checkout: checkoutData,
      })
      .eq("id", orderId);

    return res.status(200).json({
      success: true,
      cartId,
      checkout: checkoutData,
    });
  } catch (err) {
    console.error("ship-automated error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
