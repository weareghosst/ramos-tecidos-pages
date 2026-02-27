import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmedEmail } from '@/lib/email/sendOrderConfirmedEmail'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔔 Webhook received')
  console.log('Body:', req.body)

  try {
    const paymentId = req.body?.data?.id

    if (!paymentId) {
      console.log('❌ No payment ID found')
      return res.status(200).end()
    }

    console.log('💳 Payment ID:', paymentId)

    // Consulta pagamento REAL no Mercado Pago
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
        }
      }
    )

    const payment = await mpRes.json()

    console.log('📦 Mercado Pago status:', payment.status)

    if (payment.status !== 'approved') {
      console.log('⏳ Payment not approved yet')
      return res.status(200).end()
    }

    const orderId = payment.external_reference

    if (!orderId) {
      console.log('❌ No external_reference found')
      return res.status(200).end()
    }

    console.log('🧾 Order ID:', orderId)

    // Busca pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.log('❌ Order not found:', orderError)
      return res.status(200).end()
    }

    console.log('📄 Order found. Current status:', order.status)

    // Atualiza status se necessário
    if (order.status !== 'paid') {
      console.log('🔄 Updating order to paid')

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
      console.log('📧 Email already sent. Skipping.')
      return res.status(200).end()
    }

    console.log('📦 Fetching order items')

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    console.log('📧 Sending confirmation email to:', order.email)

    await sendOrderConfirmedEmail({
      orderId,
      customerName: order.customer_name,
      email: order.email,
      totalPrice: order.total_price,
      shippingMethod: order.shipping_method,
      shippingPrice: order.shipping_price,
      items: items || []
    })

    console.log('✅ Email sent successfully')

    await supabase
      .from('orders')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log('🟢 Webhook finished successfully')

    return res.status(200).end()
  } catch (err) {
    console.error('🔥 Webhook error:', err)
    return res.status(200).end()
  }
}