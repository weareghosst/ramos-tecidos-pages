import Link from "next/link";

export type ProductCardProduct = {
  id: string;
  name: string;
  price_per_meter: number;
  image_url?: string | null;
  slug: string;
};

export default function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {
  return (
    <div className="card p-4 lift">
      <div className="aspect-square w-full rounded-xl bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-slate-400">Sem imagem</span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900 line-clamp-2">
        {product.name}
      </h3>

      <p className="mt-1 text-sm text-slate-600">
        R$ {Number(product.price_per_meter || 0).toFixed(2)} / metro
      </p>

      <Link
        href={`/produto/${product.slug}`}
        className="btn-primary mt-4 w-full text-sm press"
      >
        Ver produto
      </Link>
    </div>
  );
}