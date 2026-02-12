import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendOrderPaidEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
}) {
  const { to, customerName, orderId } = params;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `Pedido confirmado — ${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2>Pedido confirmado ✅</h2>
        <p>Olá, ${customerName}! Recebemos o pagamento do seu pedido.</p>
        <p><b>Número do pedido:</b> ${orderId}</p>
        <p>Você vai receber atualizações por e-mail assim que o envio for postado.</p>
      </div>
    `,
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  trackingCode?: string;
  trackingUrl?: string;
}) {
  const { to, customerName, orderId, trackingCode, trackingUrl } = params;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `Pedido enviado 🚚 — ${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5">
        <h2>Seu pedido foi enviado 🚚</h2>
        <p>Olá, ${customerName}!</p>
        <p><b>Pedido:</b> ${orderId}</p>
        ${
          trackingCode || trackingUrl
            ? `<p><b>Código de rastreio:</b> ${trackingCode || "-"}<br/>
               ${trackingUrl ? `<a href="${trackingUrl}">Acompanhar entrega</a>` : ""}</p>`
            : `<p>Assim que o rastreio estiver disponível, enviaremos aqui.</p>`
        }
      </div>
    `,
  });
}
