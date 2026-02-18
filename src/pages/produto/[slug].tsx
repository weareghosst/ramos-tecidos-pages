import { useRouter } from "next/router";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { addToCart } from "@/lib/cart";

const fetcher = (url: string) => fetch(url).then(res => res.json());

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

  const product = data?.product;

  const [meters, setMeters] = useState(0.5);

  const price = Number(product?.price_per_meter ?? 0);

  const total = useMemo(() => {
    return meters * price;
  }, [meters, price]);

  if (isLoading || !slug) {
    return <div className="p-10">Carregando...</div>;
  }

  if (!product) {
    return <div className="p-10">Produto não encontrado</div>;
  }

  function handleAddToCart() {
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price_per_meter: price,
      meters,
      image: product.image_url ?? null,
    });

    router.push("/carrinho");
  }

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-10">

      {/* IMAGEM */}
      <div className="card p-6">
        <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center overflow-hidden">

          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-gray-400">
              Foto do tecido
            </span>
          )}

        </div>
      </div>

      {/* INFO */}
      <div className="card p-8 space-y-6">

        <div>
          <h1 className="text-3xl font-semibold mb-2">
            {product.name}
          </h1>

          <p className="text-gray-600">
            {product.description}
          </p>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-gray-500 text-sm">Preço</p>
            <p className="text-2xl font-bold">
              {money(price)}
              <span className="text-sm text-gray-500"> / metro</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-2xl font-bold text-green-600">
              {money(total)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">
            Selecione a metragem
          </p>

          <div className="flex flex-wrap gap-2">
            {[0.5, 1, 1.5, 2, 2.5, 3].map((m) => (
              <button
                key={m}
                onClick={() => setMeters(m)}
                className={`btn-outline ${
                  meters === m ? "bg-gray-100" : ""
                }`}
              >
                {m} m
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="btn-primary"
        >
          Adicionar ao carrinho
        </button>

      </div>
    </div>
  );
}
