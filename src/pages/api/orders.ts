import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL!,               // 👈 server env
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // 👈 server env
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { customer, items } = req.body;

    if (!customer || !items?.length) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    // ... resto do código
    return res.status(200).json({ orderId: "ok" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
