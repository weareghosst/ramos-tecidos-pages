import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

type OrderItem = {
  product_name: string
  quantity: number
  price: number
}

type SendOrderEmailParams = {
  orderId: string
  customerName: string
  email: string
  totalPrice: number
  shippingMethod: string
  shippingPrice: number
  items: OrderItem[]
}

export async function sendOrderConfirmedEmail({
  orderId,
  customerName,
  email,
  totalPrice,
  shippingMethod,
  shippingPrice,
  items
}: SendOrderEmailParams) {
  const itemsHtml = items
    .map(
      item => `
        <tr>
          <td>${item.product_name}</td>
          <td align="center">${item.quantity}</td>
          <td align="right">R$ ${(item.price / 100).toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Pedido confirmado – Ramos Tecidos',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Olá, ${customerName} 👋</h2>

        <p>Seu pedido foi <strong>confirmado com sucesso</strong>!</p>

        <p><strong>Número do pedido:</strong> ${orderId}</p>

        <h3>Itens do pedido</h3>
        <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left">Produto</th>
              <th align="center">Qtd</th>
              <th align="right">Preço</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p><strong>Frete:</strong> ${shippingMethod} – R$ ${(shippingPrice / 100).toFixed(2)}</p>

        <h3>Total pago: R$ ${(totalPrice / 100).toFixed(2)}</h3>

        <p>
          Em breve você receberá novas atualizações do seu pedido por e-mail,
          incluindo o código de rastreio.
        </p>

        <p style="margin-top: 32px;">
          Obrigado por comprar na <strong>Ramos Tecidos</strong> ❤️
        </p>
      </div>
    `
  })
}
