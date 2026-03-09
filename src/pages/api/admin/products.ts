import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { ProductVariant } from "../../../types/catalog";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toSafeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price_per_meter,
        stock_meters,
        image_url,
        active,
        created_at,
        variants:product_variants(
          id,
          color_name,
          color_hex,
          image_url,
          stock_meters,
          active
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    try {
      const {
        name,
        slug,
        description,
        price_per_meter,
        image_url,
        active,
        variants,
      } = req.body as {
        name: string;
        slug: string;
        description: string;
        price_per_meter: number;
        image_url: string | null;
        active: boolean;
        variants: ProductVariant[];
      };

      if (!name?.trim()) {
        return res.status(400).json({ error: "Nome do produto é obrigatório" });
      }

      const cleanVariants = Array.isArray(variants)
        ? variants.filter((v) => v?.color_name?.trim())
        : [];

      const stockTotal = cleanVariants.reduce((sum, variant) => {
        return sum + toSafeNumber(variant.stock_meters);
      }, 0);

      const safePricePerMeter = toSafeNumber(price_per_meter);

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug: slugify(slug || name),
          description: description || null,
          price_per_meter: safePricePerMeter,
          stock_meters: stockTotal,
          image_url: image_url || null,
          active: typeof active === "boolean" ? active : true,
        })
        .select("id")
        .single();

      if (productError || !product) {
        return res.status(500).json({
          error: productError?.message || "Erro ao criar produto",
        });
      }

      if (cleanVariants.length > 0) {
        const variantsPayload = cleanVariants.map((variant) => ({
          product_id: product.id,
          color_name: variant.color_name.trim(),
          color_hex: variant.color_hex || null,
          image_url: variant.image_url || null,
          stock_meters: toSafeNumber(variant.stock_meters),
          active: typeof variant.active === "boolean" ? variant.active : true,
        }));

        const { error: variantsError } = await supabase
          .from("product_variants")
          .insert(variantsPayload);

        if (variantsError) {
          await supabase.from("products").delete().eq("id", product.id);

          return res.status(500).json({
            error: variantsError.message,
          });
        }
      }

      return res.status(201).json({
        success: true,
        id: product.id,
      });
    } catch (error: any) {
      console.error("POST /api/admin/products error:", error);

      return res.status(500).json({
        error: error?.message || "Erro interno ao criar produto",
      });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}