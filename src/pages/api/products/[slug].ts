import type { NextApiRequest, NextApiResponse } from "next";
import { getProductBySlug } from "@/lib/products";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = String(req.query.slug || "");
  const product = await getProductBySlug(slug);

  if (!product) return res.status(404).json({ error: "Not found" });
  return res.status(200).json({ product });
}
