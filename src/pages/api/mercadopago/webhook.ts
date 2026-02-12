import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmedEmail } from '@/lib/email/sendOrderConfirmedEmail'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const paymentId = req.body?.data?.id
    if (!paymentId) return res.status(200).end()

    // Consulta pagamento REAL
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
        }
      }
    )

    const payment = await mpRes.json()

    if (payment.status !== 'approved') {
      return res.status(200).end()
    }

    const orderId = payment.external_reference

    // Busca pedido
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (!order) return res.status(200).end()

    // Atualiza status se necessário
    if (order.status !== 'paid') {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          mp_payment_id: payment.id,
          mp_status: payment.status,
          paid_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }

    // 🔒 TRAVA DE E-MAIL
    if (order.email_sent) {
      return res.status(200).end()
    }

    // Busca itens
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    // Envia email
    await sendOrderConfirmedEmail({
      orderId,
      customerName: order.customer_name,
      email: order.email,
      totalPrice: order.total_price,
      shippingMethod: order.shipping_method,
      shippingPrice: order.shipping_price,
      items: items || []
    })

    // Marca como enviado
    await supabase
      .from('orders')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return res.status(200).end()
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(200).end()
  }
}
