import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

type RawOrderItem = {
  product_name?: string
  product?: { name?: string }
  products?: { name?: string }
  name?: string
  title?: string
  quantity?: number
  qty?: number
  meters?: number
  price?: number
  unit_price?: number
  price_per_meter?: number
  subtotal?: number
  total_price?: number
}

type SendOrderEmailParams = {
  orderId: string
  customerName: string
  email: string
  totalPrice: number
  shippingMethod: string
  shippingPrice: number
  items: RawOrderItem[]
}

function formatCurrency(value: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`
}

function normalizeItem(item: RawOrderItem) {
  const name =
    item.product_name ||
    item.product?.name ||
    item.products?.name ||
    item.name ||
    item.title ||
    'Produto'

  const quantity =
    item.quantity ??
    item.qty ??
    item.meters ??
    1

  let lineTotal = 0

  if (typeof item.price === 'number') {
    lineTotal = item.price > 1000 ? item.price / 100 : item.price
  } else if (typeof item.subtotal === 'number') {
    lineTotal = item.subtotal
  } else if (typeof item.total_price === 'number') {
    lineTotal = item.total_price
  } else {
    lineTotal = Number(quantity) * Number(item.price_per_meter || item.unit_price || 0)
  }

  return {
    name,
    quantity: Number(quantity),
    lineTotal: Number(lineTotal),
  }
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
  const normalizedItems = (items || []).map(normalizeItem)

  const itemsHtml = normalizedItems
    .map(
      item => `
        <tr>
          <td>${item.name}</td>
          <td align="center">${item.quantity}</td>
          <td align="right">${formatCurrency(item.lineTotal)}</td>
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
            ${itemsHtml || `
              <tr>
                <td colspan="3" align="center">Itens não encontrados</td>
              </tr>
            `}
          </tbody>
        </table>

        <p><strong>Frete:</strong> ${shippingMethod} – ${formatCurrency(Number(shippingPrice || 0))}</p>

        <h3>Total pago: ${formatCurrency(Number(totalPrice || 0))}</h3>

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