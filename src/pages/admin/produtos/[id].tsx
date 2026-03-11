import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";
import ProductForm from "../../../components/admin/ProductForm";
import { Product } from "../../../types/catalog";

type Props = {
  product: Product | null;
};

export default function EditProductPage({ product }: Props) {
  if (!product) {
    return <div className="card p-6">Produto não encontrado.</div>;
  }

  return <ProductForm initialData={product} />;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id || "");

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { data } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      description,
      price_per_meter,
      stock_meters,
      image_url,
      fabric_type,
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

  return {
    props: {
      product: (data || null) as Product | null,
    },
  };
};
