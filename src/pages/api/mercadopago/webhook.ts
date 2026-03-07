import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendOrderConfirmedEmail } from '@/lib/email/sendOrderConfirmedEmail'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function safeParseBody(body: NextApiRequest['body']) {
  if (!body) return {}

  if (typeof body === 'object') {
    return body
  }

  if (typeof body === 'string') {
    const trimmed = body.trim()

    if (!trimmed) return {}

    try {
      return JSON.parse(trimmed)
    } catch (error) {
      console.error('❌ Failed to parse webhook body string:', error)
      return {}
    }
  }

  return {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔔 Webhook called')
    console.log('Method:', req.method)
    console.log('Headers:', req.headers)

    if (req.method !== 'POST') {
      console.log('❌ Invalid method')
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = safeParseBody(req.body)

    console.log('Body:', body)

    const paymentId =
      body?.data?.id ||
      body?.id ||
      body?.resource?.split('/')?.pop() ||
      req.query?.['data.id'] ||
      req.query?.id

    if (!paymentId) {
      console.log('❌ No payment ID found')
      return res.status(200).json({ received: true })
    }

    console.log('💳 Payment ID:', paymentId)

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
        }
      }
    )

    if (mpRes.status === 404) {
      const notFoundText = await mpRes.text()

      console.log('⚠️ Payment not found for current token/account')
      console.log('ℹ️ This can happen with Mercado Pago webhook simulation or mismatched credentials')
      console.log('Mercado Pago 404 body:', notFoundText)

      return res.status(200).json({
        received: true,
        ignored: 'payment_not_found'
      })
    }

    if (!mpRes.ok) {
      const errorText = await mpRes.text()
      console.log('❌ Mercado Pago payment fetch failed:', mpRes.status, errorText)

      return res.status(200).json({
        received: true,
        ignored: 'payment_fetch_failed'
      })
    }

    const payment = await mpRes.json()

    console.log('📦 Mercado Pago status:', payment.status)
    console.log('🧾 Mercado Pago external_reference:', payment.external_reference)

    if (payment.status !== 'approved') {
      console.log('⏳ Payment not approved yet')
      return res.status(200).json({ received: true })
    }

    const orderId = payment.external_reference

    if (!orderId) {
      console.log('❌ No external_reference found')
      return res.status(200).json({ received: true })
    }

    console.log('🧾 Order ID:', orderId)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.log('❌ Order not found:', orderError)
      return res.status(200).json({ received: true })
    }

    console.log('📄 Order found. Current status:', order.status)

    if (order.status !== 'paid') {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          mp_payment_id: payment.id,
          mp_status: payment.status,
          paid_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateOrderError) {
        console.log('❌ Failed to update order as paid:', updateOrderError)
        return res.status(200).json({ received: true })
      }

      console.log('✅ Order updated to paid')
    }

    // trava real contra envio duplicado
    const { data: emailLockRow, error: emailLockError } = await supabase
      .from('orders')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('email_sent', false)
      .select('id')
      .maybeSingle()

    if (emailLockError) {
      console.log('❌ Failed to acquire email lock:', emailLockError)
      return res.status(200).json({ received: true })
    }

    if (!emailLockRow) {
      console.log('📧 Email already sent or lock already acquired')
      return res.status(200).json({ received: true })
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.log('❌ Failed to fetch order items:', itemsError)
      return res.status(200).json({ received: true })
    }

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

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('🔥 Webhook error:', err)
    return res.status(200).json({ error: true })
  }
}