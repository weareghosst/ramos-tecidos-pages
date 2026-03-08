import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

function asNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickShippingServiceId(order: any) {
  return (
    order?.shipping_address?.service_id ??
    order?.shipping_service_id ??
    order?.service_id ??
    null
  );
}

function getBaseUrl() {
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

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select(`
        *,
        product:products (
          id,
          name,
          slug
        )
      `)
      .eq("order_id", orderId);

    if (itemsErr) {
      return res.status(500).json({ error: "Erro ao buscar itens do pedido" });
    }

    const serviceId = pickShippingServiceId(order);
    if (!serviceId) {
      return res.status(400).json({
        error:
          "Pedido sem service_id do Melhor Envio. Salve o serviço escolhido no checkout.",
      });
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "MELHOR_ENVIO_TOKEN não configurado" });
    }

    const shippingAddress = order.shipping_address || {};

    const to = {
      name: order.customer_name ?? "Cliente",
      phone: order.phone ?? "",
      email: order.email ?? "",
      address: shippingAddress.street ?? "",
      number: shippingAddress.number ?? "",
      district: shippingAddress.district ?? "",
      city: shippingAddress.city ?? "",
      state_abbr: shippingAddress.state ?? "",
      postal_code: String(shippingAddress.cep || "").replace(/\D/g, ""),
      complement: shippingAddress.complement ?? "",
    };

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
      postal_code: String(process.env.ME_FROM_CEP || "00000000").replace(/\D/g, ""),
    };

    const pkg = {
      weight: asNumber(order.package_weight, 0.3),
      width: asNumber(order.package_width, 11),
      height: asNumber(order.package_height, 2),
      length: asNumber(order.package_length, 16),
    };

    const insuranceValue = asNumber(order.total_price, 0);

    const products = (items || []).map((item: any, index: number) => ({
      name:
        item.product_name ||
        item.product?.name ||
        `Pedido ${order.id} - Item ${index + 1}`,
      quantity: 1,
      unitary_value: asNumber(item.meters, 0) * asNumber(item.price_per_meter, 0),
      weight: pkg.weight,
      width: pkg.width,
      height: pkg.height,
      length: pkg.length,
    }));

    const baseUrl = getBaseUrl();

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