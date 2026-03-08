import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price_per_meter: number;
  stock_meters: number;
  active: boolean;
  image_url?: string | null;
};

function money(value: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      }
    });
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/products");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar produtos");
        }

        if (!mounted) return;

        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setProducts(normalized);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Erro ao carregar produtos");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="p-8">Carregando produtos...</p>;
  }

  if (error) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Produtos</h1>
          <Link href="/admin/produtos/novo" className="btn-primary px-4 py-2">
            Novo produto
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Produtos</h1>

        <Link href="/admin/produtos/novo" className="btn-primary px-4 py-2">
          Novo produto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-right">Preço / metro</th>
              <th className="p-3 text-right">Estoque</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="border-t border-slate-200">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Sem imagem
                          </span>
                        )}
                      </div>

                      <span className="font-medium text-slate-900">
                        {product.name}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-slate-600">{product.slug}</td>

                  <td className="p-3 text-right">
                    {money(product.price_per_meter)}
                  </td>

                  <td className="p-3 text-right">
                    {Number(product.stock_meters || 0).toFixed(1)} m
                  </td>

                  <td className="p-3 text-center">
                    {product.active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="text-blue-600 underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-200">
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}