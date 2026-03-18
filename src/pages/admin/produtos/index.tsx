import Link from "next/link";
import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRouter } from "next/router";
import { useState } from "react";
import { Product } from "../../../types/catalog";

type Props = { products: Product[] };

export default function AdminProductsPage({ products }: Props) {
  const { checking, authenticated } = useAdminAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`Excluir "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir produto");
      router.replace(router.asPath);
    } catch (error: any) {
      alert(error?.message || "Erro ao excluir produto");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/produtos/importar" className="btn-outline px-3 py-2 text-sm">Importar em massa</Link>
          <Link href="/admin/produtos/novo" className="btn-primary px-3 py-2 text-sm">+ Novo produto</Link>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar produto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Cores</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">Nenhum produto encontrado</td>
              </tr>
            ) : filtered.map((product) => (
              <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                <td className="px-4 py-2.5 font-medium text-slate-900">{product.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{(product as any).fabric_type || "-"}</td>
                <td className="px-4 py-2.5">R$ {Number(product.price_per_meter).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-slate-500">{Number(product.stock_meters).toFixed(1)} m</td>
                <td className="px-4 py-2.5 text-slate-500">{product.variants?.length || 0}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {product.active ? "ativo" : "inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/produtos/${product.id}`} className="text-slate-700 hover:text-slate-900 font-medium">Editar</Link>
                    <button type="button" onClick={() => handleDeleteProduct(product.id, product.name)} className="text-red-500 hover:text-red-700">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  const { data } = await supabase.from("products").select(`id,name,slug,fabric_type,price_per_meter,stock_meters,image_url,active,created_at,variants:product_variants(id,color_name)`).order("created_at", { ascending: false });
  return { props: { products: (data || []) as Product[] } };
};
