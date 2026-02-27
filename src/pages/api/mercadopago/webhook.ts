import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmedEmail } from '@/lib/email/sendOrderConfirmedEmail'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔔 Webhook called')
    console.log('Method:', req.method)
    console.log('Headers:', req.headers)

    // 🔎 Força leitura segura do body
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body

    console.log('Body parsed:', body)

    const paymentId = body?.data?.id

    if (!paymentId) {
      console.log('❌ Payment ID not found')
      return res.status(200).json({ received: true })
    }

    console.log('💳 Payment ID:', paymentId)

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

    console.log('📦 Mercado Pago status:', payment.status)

    if (payment.status !== 'approved') {
      console.log('⏳ Not approved yet')
      return res.status(200).json({ received: true })
    }

    const orderId = payment.external_reference

    if (!orderId) {
      console.log('❌ external_reference missing')
      return res.status(200).json({ received: true })
    }

    console.log('🧾 Order ID:', orderId)

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.log('❌ Order not found:', error)
      return res.status(200).json({ received: true })
    }

    console.log('📄 Order status:', order.status)

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

    if (order.email_sent) {
      console.log('📧 Email already sent')
      return res.status(200).json({ received: true })
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    console.log('📧 Sending email to:', order.email)

    await sendOrderConfirmedEmail({
      orderId,
      customerName: order.customer_name,
      email: order.email,
      totalPrice: order.total_price,
      shippingMethod: order.shipping_method,
      shippingPrice: order.shipping_price,
      items: items || []
    })

    await supabase
      .from('orders')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log('✅ Email sent successfully')

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('🔥 Webhook error:', err)
    return res.status(200).json({ error: true })
  }
}