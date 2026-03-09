import Link from "next/link";

export type ProductCardProduct = {
  id: string;
  name: string;
  price_per_meter: number;
  image_url?: string | null;
  slug: string;
  fabric_type?: string | null;
};

export default function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Sem imagem
          </div>
        )}
      </div>

      <div className="p-4">
        {product.fabric_type ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {product.fabric_type}
          </p>
        ) : null}

        <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>

        <p className="mt-2 text-slate-600">
          R$ {Number(product.price_per_meter || 0).toFixed(2)} / metro
        </p>

        <Link
          href={`/produto/${product.slug}`}
          className="mt-4 inline-flex btn-primary px-4 py-2"
        >
          Ver produto
        </Link>
      </div>
    </div>
  );
}