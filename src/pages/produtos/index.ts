// src/pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listProducts } from "@/lib/products";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const products = await listProducts();
  return res.status(200).json({ products });
}
