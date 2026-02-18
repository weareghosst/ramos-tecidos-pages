import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminProdutos() {
  const { data, mutate } = useSWR("/api/admin/products", fetcher);

  const products = data?.products || [];

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este produto?")) return;

    await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    mutate();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Produtos</h1>

        <Link href="/admin/produtos/novo" className="btn-primary">
          Novo produto
        </Link>
      </div>

      <div className="card p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Nome</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Estoque</th>
              <th className="p-2">Ativo</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="p-2">
                  R$ {Number(p.price_per_meter).toFixed(2)}
                </td>
                <td className="p-2">{p.stock_meters} m</td>
                <td className="p-2">
                  {p.active ? "Sim" : "Não"}
                </td>
                <td className="p-2 space-x-2">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="btn-outline text-xs"
                  >
                    Editar
                  </Link>

<button
  onClick={async () => {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("Produto excluído!");
      window.location.reload();
    } else {
      alert("Erro ao excluir");
    }
  }}
  className="btn-outline text-xs"
>
  Excluir
</button>


                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
