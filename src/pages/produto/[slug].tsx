import { useRouter } from "next/router";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import ColorSelector from "@/components/products/ColorSelector";
import type { Product, ProductVariant } from "@/types/catalog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutoDetalhe() {
  const router = useRouter();

  const slugParam = router.query.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
      ? slugParam[0]
      : null;

  const { data, isLoading } = useSWR(
    slug ? `/api/products/${slug}` : null,
    fetcher
  );

  const product = (data?.product || null) as Product | null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [meters, setMeters] = useState(0.5);

  const activeVariants = useMemo(() => {
    return (product?.variants || []).filter((v) => v.active);
  }, [product]);

  const effectiveVariant = selectedVariant || activeVariants[0] || null;

  const price = Number(product?.price_per_meter ?? 0);
  const currentImage = effectiveVariant?.image_url || product?.image_url || null;
  const currentStock = Number(
    effectiveVariant?.stock_meters ?? product?.stock_meters ?? 0
  );

  const total = useMemo(() => {
    return meters * price;
  }, [meters, price]);

  if (isLoading || !slug) {
    return <div className="p-10">Carregando...</div>;
  }

  if (!product) {
    return <div className="p-10">Produto não encontrado</div>;
  }

  const safeProduct = product;

  function handleAddToCart() {
    if (activeVariants.length > 0 && !effectiveVariant) {
      alert("Selecione uma cor antes de adicionar ao carrinho.");
      return;
    }

    if (meters > currentStock) {
      alert("Estoque insuficiente para esta cor.");
      return;
    }

    addToCart({
      product_id: safeProduct.id,
      slug: safeProduct.slug,
      name: safeProduct.name,
      image_url: currentImage,
      meters,
      price_per_meter: price,
      variant_id: effectiveVariant?.id || null,
      color_name: effectiveVariant?.color_name || null,
      color_hex: effectiveVariant?.color_hex || null,
    });

    router.push("/carrinho");
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-10">
      <div>
        {currentImage ? (
          <img
            src={currentImage}
            alt={safeProduct.name}
            className="w-full rounded-2xl border object-cover"
          />
        ) : (
          <div className="w-full aspect-square rounded-2xl border bg-gray-100 flex items-center justify-center text-gray-400">
            Foto do tecido
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{safeProduct.name}</h1>

        {safeProduct.description ? (
          <p className="mt-3 text-gray-600">{safeProduct.description}</p>
        ) : null}

        <div className="mt-6">
          <p className="text-sm text-gray-500">Preço</p>
          <p className="text-2xl font-semibold">{money(price)} / metro</p>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold">{money(total)}</p>
        </div>

        {activeVariants.length > 0 ? (
          <div className="mt-6">
            <ColorSelector
              variants={activeVariants}
              selectedVariantId={effectiveVariant?.id || null}
              onSelect={(variant) => setSelectedVariant(variant)}
            />
          </div>
        ) : null}

        {effectiveVariant?.color_name ? (
          <p className="mt-3 text-sm text-slate-600">
            Cor selecionada: <strong>{effectiveVariant.color_name}</strong>
          </p>
        ) : null}

        <p className="mt-2 text-sm text-slate-500">
          Estoque disponível: {Number(currentStock).toFixed(1)} m
        </p>

        <div className="mt-6">
          <p className="font-medium mb-3">Selecione a metragem</p>

          <div className="flex flex-wrap gap-2">
            {[0.5, 1, 1.5, 2, 2.5, 3].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeters(m)}
                className={`btn-outline ${meters === m ? "bg-gray-100" : ""}`}
              >
                {m} m
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="btn-primary mt-8 w-full"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}