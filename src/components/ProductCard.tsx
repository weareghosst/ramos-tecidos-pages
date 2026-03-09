import Link from "next/link";

export default function ProductCard({ product }: any) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition">

      <div className="aspect-square bg-slate-100 overflow-hidden">

        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Sem imagem
          </div>
        )}

      </div>

      <div className="p-4 space-y-2">

        {product.fabric_type && (
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            {product.fabric_type}
          </span>
        )}

        <h3 className="font-semibold text-lg text-slate-900">
          {product.name}
        </h3>

        <p className="text-slate-600">
          R$ {Number(product.price_per_meter).toFixed(2)} / metro
        </p>

        <Link
          href={`/produto/${product.slug}`}
          className="inline-block mt-2 text-sm font-medium text-slate-900 hover:underline"
        >
          Ver produto →
        </Link>

      </div>

    </div>
  );
}