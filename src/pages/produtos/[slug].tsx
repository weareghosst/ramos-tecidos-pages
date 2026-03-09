import Image from "next/image";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ColorSelector from "../../components/products/ColorSelector";
import { addToCart } from "../../lib/cart";
import { Product, ProductVariant } from "../../types/catalog";

type Props = {
  product: Product | null;
};

export default function ProductPage({ product }: Props) {
  const [meters, setMeters] = useState(0.5);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product?.variants?.[0] || null
  );

  if (!product) {
    return (
      <div className="card p-6">
        <p className="text-slate-600">Produto não encontrado.</p>
        <Link href="/produtos" className="mt-4 inline-flex btn-primary px-4 py-2">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const displayImage = selectedVariant?.image_url || product.image_url || null;
  const currentStock =
    selectedVariant?.stock_meters ?? product.stock_meters ?? 0;

  const totalPrice = useMemo(() => {
    return Number(product.price_per_meter) * meters;
  }, [product.price_per_meter, meters]);

  const increment = () => {
    const next = Number((meters + 0.5).toFixed(2));
    if (next <= Number(currentStock)) setMeters(next);
  };

  const decrement = () => {
    const next = Number((meters - 0.5).toFixed(2));
    if (next >= 0.5) setMeters(next);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert("Selecione uma cor antes de adicionar ao carrinho.");
      return;
    }

    if (meters > Number(currentStock)) {
      alert("Estoque insuficiente para esta cor.");
      return;
    }

    addToCart({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image_url: displayImage,
      meters,
      price_per_meter: Number(product.price_per_meter),
      variant_id: selectedVariant.id || null,
      color_name: selectedVariant.color_name,
      color_hex: selectedVariant.color_hex || null,
    });

    alert("Produto adicionado ao carrinho.");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card p-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              Sem imagem
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            R$ {Number(product.price_per_meter).toFixed(2)} / metro
          </p>
          {product.description ? (
            <p className="mt-4 text-slate-600">{product.description}</p>
          ) : null}
        </div>

        {product.variants && product.variants.length > 0 ? (
          <ColorSelector
            variants={product.variants.filter((v) => v.active)}
            selectedVariantId={selectedVariant?.id || null}
            onSelect={setSelectedVariant}
          />
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Metragem</p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decrement}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              -
            </button>

            <div className="min-w-[110px] rounded-lg border border-slate-200 px-4 py-2 text-center">
              {meters.toFixed(1)} m
            </div>

            <button
              type="button"
              onClick={increment}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              +
            </button>
          </div>

          <p className="text-sm text-slate-500">
            Estoque disponível nesta cor: {Number(currentStock).toFixed(1)} m
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-slate-500">Resumo</p>
          <p className="mt-2 text-lg font-semibold">
            Total: R$ {totalPrice.toFixed(2)}
          </p>

          {selectedVariant ? (
            <p className="mt-1 text-sm text-slate-600">
              Cor selecionada: <strong>{selectedVariant.color_name}</strong>
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-4 btn-primary w-full px-5 py-3"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

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
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    return {
      props: {
        product: null,
      },
    };
  }

  return {
    props: {
      product: data as Product,
    },
  };
};