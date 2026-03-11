import Link from "next/link";
import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRouter } from "next/router";
import { Product } from "../../../types/catalog";

type Props = { products: Product[] };

export default function AdminProductsPage({ products }: Props) {
  const { checking, authenticated } = useAdminAuth();
  const router = useRouter();

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`Excluir o produto "${name}"?`)) return;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-2 text-slate-600">Gerencie produtos, cores e estoque.</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary px-4 py-3">Novo produto</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Cores</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">{product.slug}</td>
                <td className="px-4 py-3">R$ {Number(product.price_per_meter).toFixed(2)}</td>
                <td className="px-4 py-3">{Number(product.stock_meters).toFixed(1)} m</td>
                <td className="px-4 py-3">{product.variants?.length || 0}</td>
                <td className="px-4 py-3">{product.active ? "ativo" : "inativo"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/produtos/${product.id}`} className="font-medium text-slate-900 hover:text-slate-700">Editar</Link>
                    <button type="button" onClick={() => handleDeleteProduct(product.id, product.name)} className="font-medium text-red-600 hover:text-red-700">Excluir</button>
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
  const { data } = await supabase.from("products").select(`id,name,slug,description,price_per_meter,stock_meters,image_url,active,created_at,variants:product_variants(id,color_name)`).order("created_at", { ascending: false });
  return { props: { products: (data || []) as Product[] } };
};
