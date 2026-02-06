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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
      <div className="aspect-square w-full rounded-xl bg-white/10 mb-4 flex items-center justify-center text-white/40">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover rounded-xl"
          />
        ) : (
          <span>Sem imagem</span>
        )}
      </div>

      <h3 className="font-semibold text-white">{product.name}</h3>

      <p className="mt-1 text-sm text-white/70">
        R$ {product.price_per_meter.toFixed(2)} / metro
      </p>

      <Link
        href={`/produto/${product.slug}`}
        className="mt-4 inline-block w-full rounded-xl bg-white px-3 py-2 text-center text-sm font-semibold text-black hover:bg-white/90"
      >
        Ver produto
      </Link>
    </div>
  );
}
