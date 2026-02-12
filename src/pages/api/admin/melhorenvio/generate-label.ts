import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { order } = req.body;

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
        service: order.shipping_method,
        from: { postal_code: process.env.MELHOR_ENVIO_FROM_CEP },
        to: { postal_code: order.shipping_address.cep },
        products: order.items.map((i: any) => ({
          name: i.product_name,
          quantity: i.quantity,
          unitary_value: i.price / 100,
        })),
      }),
    }
  );

  const data = await response.json();
  res.json(data);
}
