import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

function asNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function onlyDigits(v: any) {
  return String(v || "").replace(/\D/g, "");
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

function extractMelhorEnvioError(data: any) {
  if (!data) return "Resposta vazia do Melhor Envio";

  if (typeof data === "string") return data;

  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  if (data.error && typeof data.error === "string") {
    return data.error;
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];

    if (typeof first === "string") return first;

    if (first?.message) return first.message;

    return JSON.stringify(first);
  }

  if (data?.data?.message) {
    return data.data.message;
  }

  return JSON.stringify(data);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        error: "Pedido sem service_id do Melhor Envio. Refaça o checkout com um frete selecionado.",
      });
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "MELHOR_ENVIO_TOKEN não configurado",
      });
    }

    const shippingAddress = order.shipping_address || {};

    const to = {
      name: order.customer_name ?? "Cliente",
      phone: onlyDigits(order.phone ?? ""),
      email: order.email ?? "",
      address: shippingAddress.street ?? "",
      number: String(shippingAddress.number ?? ""),
      district: shippingAddress.district ?? "",
      city: shippingAddress.city ?? "",
      state_abbr: shippingAddress.state ?? "",
      postal_code: onlyDigits(shippingAddress.cep ?? ""),
      complement: shippingAddress.complement ?? "",
    };

    const from = {
      name: process.env.ME_FROM_NAME || "",
      phone: onlyDigits(process.env.ME_FROM_PHONE || ""),
      email: process.env.ME_FROM_EMAIL || "",
      document: onlyDigits(process.env.ME_FROM_DOCUMENT || ""),
      company_document: onlyDigits(process.env.ME_FROM_COMPANY_DOCUMENT || ""),
      state_register: process.env.ME_FROM_STATE_REGISTER || "",
      address: process.env.ME_FROM_ADDRESS || "",
      number: String(process.env.ME_FROM_NUMBER || ""),
      district: process.env.ME_FROM_DISTRICT || "",
      city: process.env.ME_FROM_CITY || "",
      state_abbr: process.env.ME_FROM_STATE || "",
      postal_code: onlyDigits(process.env.ME_FROM_CEP || ""),
    };

    const missingFromFields = [
      !from.name && "ME_FROM_NAME",
      !from.phone && "ME_FROM_PHONE",
      !from.email && "ME_FROM_EMAIL",
      !from.address && "ME_FROM_ADDRESS",
      !from.number && "ME_FROM_NUMBER",
      !from.district && "ME_FROM_DISTRICT",
      !from.city && "ME_FROM_CITY",
      !from.state_abbr && "ME_FROM_STATE",
      !from.postal_code && "ME_FROM_CEP",
    ].filter(Boolean);

    if (missingFromFields.length > 0) {
      return res.status(400).json({
        error: `Configuração incompleta do remetente. Preencha: ${missingFromFields.join(", ")}`,
      });
    }

    const missingToFields = [
      !to.name && "nome do cliente",
      !to.phone && "telefone do cliente",
      !to.email && "email do cliente",
      !to.address && "rua",
      !to.number && "número",
      !to.district && "bairro",
      !to.city && "cidade",
      !to.state_abbr && "UF",
      !to.postal_code && "CEP",
    ].filter(Boolean);

    if (missingToFields.length > 0) {
      return res.status(400).json({
        error: `Endereço do destinatário incompleto: ${missingToFields.join(", ")}`,
      });
    }

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
      unitary_value: Number(
        (asNumber(item.meters, 0) * asNumber(item.price_per_meter, 0)).toFixed(2)
      ),
      weight: pkg.weight,
      width: pkg.width,
      height: pkg.height,
      length: pkg.length,
    }));

    if (!products.length) {
      return res.status(400).json({
        error: "Pedido sem itens para envio",
      });
    }

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
        error: `Erro ao criar carrinho: ${extractMelhorEnvioError(cartData)}`,
        melhorEnvio: cartData,
        status: cartResp.status,
      });
    }

    const cartId = cartData?.id;

    if (!cartId) {
      return res.status(500).json({
        error: "Carrinho criado mas sem id retornado pelo Melhor Envio",
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
      body: JSON.stringify({
        orders: [cartId],
      }),
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
        error: `Erro no checkout da etiqueta: ${extractMelhorEnvioError(
          checkoutData
        )}`,
        melhorEnvio: checkoutData,
        status: checkoutResp.status,
      });
    }

    await supabase
      .from("orders")
      .update({
        status: "shipped",
        shipping_status: "label_requested",
        melhor_envio_cart_id: cartId,
        melhor_envio_checkout: checkoutData,
      })
      .eq("id", orderId);

    return res.status(200).json({
      success: true,
      cartId,
      checkout: checkoutData,
    });
  } catch (err: any) {
    console.error("ship-automated error:", err);

    return res.status(500).json({
      error: err?.message || "Erro interno",
    });
  }
}