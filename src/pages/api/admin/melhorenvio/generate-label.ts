import type { NextApiRequest, NextApiResponse } from "next";

function getItemName(item: any) {
  return (
    item.product_name ||
    item.product?.name ||
    item.products?.name ||
    item.name ||
    "Produto"
  );
}

function getItemQuantity(item: any) {
  return Number(item.quantity ?? item.qty ?? item.meters ?? 1);
}

function getItemUnitaryValue(item: any) {
  if (typeof item.price === "number") {
    return item.price > 1000 ? item.price / 100 : item.price;
  }

  return Number(item.price_per_meter || item.unit_price || 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { order } = req.body;

  const serviceId =
    order?.melhor_envio_service_id ||
    order?.service_id ||
    order?.shipping_service_id ||
    order?.shipping_method;

  if (!serviceId) {
    return res.status(400).json({
      error:
        "Pedido sem service_id do Melhor Envio. Salve o serviço escolhido no checkout (ex: melhor_envio_service_id).",
    });
  }

  const destinationCep =
    order?.shipping_address?.cep ||
    order?.shipping_address?.postal_code;

  const response = await fetch(
    "https://api.melhorenvio.com.br/v2/me/cart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Ramos Tecidos",
      },
      body: JSON.stringify({
        service: serviceId,
        from: { postal_code: process.env.MELHOR_ENVIO_FROM_CEP },
        to: { postal_code: destinationCep },
        products: (order.items || []).map((i: any) => ({
          name: getItemName(i),
          quantity: getItemQuantity(i),
          unitary_value: getItemUnitaryValue(i),
        })),
      }),
    }
  );

  const data = await response.json();
  res.status(response.status).json(data);
}