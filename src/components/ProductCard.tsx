import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price_per_meter: number;
  image?: string;
  slug: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card p-4 lift">
      {/* Imagem */}
      <div className="aspect-square w-full rounded-xl bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-slate-400">Sem imagem</span>
        )}
      </div>

      {/* Nome */}
      <h3 className="font-semibold text-slate-900 line-clamp-2">
        {product.name}
      </h3>

      {/* Preço */}
      <p className="mt-1 text-sm text-slate-600">
        R$ {product.price_per_meter.toFixed(2)} / metro
      </p>

      {/* CTA */}
      <Link
        href={`/produto/${product.slug}`}
        className="btn-primary mt-4 w-full text-sm press"
      >
        Ver produto
      </Link>
    </div>
  );
}
