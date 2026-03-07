import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = await resend.emails.send({
      from: "contato@ramostecidos.com.br",
      to: "hgbudankehb@gmail.com",
      subject: "Teste Ramos Tecidos",
      html: "<strong>Email funcionando 🚀</strong>",
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
}