import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { ProductVariant } from "../../../../types/catalog";

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
  const id = String(req.query.id || "");

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
          product_id,
          color_name,
          color_hex,
          image_url,
          stock_meters,
          active,
          created_at
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
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
        description: string | null;
        price_per_meter: number;
        image_url: string | null;
        active: boolean;
        variants: ProductVariant[];
      };

      const cleanVariants = Array.isArray(variants)
        ? variants.filter((v) => v?.color_name?.trim())
        : [];

      const stockTotal = cleanVariants.reduce((sum, variant) => {
        return sum + toSafeNumber(variant.stock_meters);
      }, 0);

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: name?.trim() || "",
          slug: slugify(slug || name || ""),
          description: description || null,
          price_per_meter: toSafeNumber(price_per_meter),
          stock_meters: stockTotal,
          image_url: image_url || null,
          active: typeof active === "boolean" ? active : true,
        })
        .eq("id", id);

      if (productError) {
        return res.status(500).json({ error: productError.message });
      }

      const { data: existingVariants, error: existingVariantsError } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", id);

      if (existingVariantsError) {
        return res.status(500).json({ error: existingVariantsError.message });
      }

      const incomingIds = cleanVariants
        .map((variant) => variant.id)
        .filter(Boolean) as string[];

      const idsToDelete = (existingVariants || [])
        .map((variant) => variant.id)
        .filter((variantId) => !incomingIds.includes(variantId));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("product_variants")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
      }

      if (cleanVariants.length > 0) {
        const upsertPayload = cleanVariants.map((variant) => ({
          id: variant.id,
          product_id: id,
          color_name: variant.color_name.trim(),
          color_hex: variant.color_hex || null,
          image_url: variant.image_url || null,
          stock_meters: toSafeNumber(variant.stock_meters),
          active: typeof variant.active === "boolean" ? variant.active : true,
        }));

        const { error: upsertError } = await supabase
          .from("product_variants")
          .upsert(upsertPayload);

        if (upsertError) {
          return res.status(500).json({ error: upsertError.message });
        }
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("PUT /api/admin/products/[id] error:", error);

      return res.status(500).json({
        error: error?.message || "Erro interno ao atualizar produto",
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Erro interno ao excluir produto",
      });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}