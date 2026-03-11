import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

type SendTrackingEmailParams = {
  orderId: string
  customerName: string
  email: string
  trackingCode: string
  shippingMethod: string
}

export async function sendTrackingEmail({
  orderId,
  customerName,
  email,
  trackingCode,
  shippingMethod,
}: SendTrackingEmailParams) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Seu pedido foi enviado! – Ramos Tecidos',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Olá, ${customerName} 👋</h2>

        <p>Seu pedido foi <strong>enviado</strong> e já está a caminho!</p>

        <p><strong>Número do pedido:</strong> ${orderId}</p>

        <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Código de rastreio</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0f172a;">
            ${trackingCode}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">
            Método: ${shippingMethod || 'Correios'}
          </p>
        </div>

        <p>
          Você pode rastrear seu pedido diretamente no site dos Correios:
          <br />
          <a href="https://rastreamento.correios.com.br/app/index.php" style="color: #2563eb;">
            rastreamento.correios.com.br
          </a>
        </p>

        <p style="margin-top: 32px;">
          Obrigado por comprar na <strong>Ramos Tecidos</strong> ❤️
        </p>
      </div>
    `,
  })
}
