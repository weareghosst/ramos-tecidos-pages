import { useRouter } from "next/router";
import useSWR from "swr";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Erro ao buscar");
  return r.json();
};

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminPedidoDetalhe() {
  const router = useRouter();

  // Durante SSR/build: router.query pode vir vazio
  const id = typeof router.query.id === "string" ? router.query.id : null;

  // Só chama a API quando tiver id e quando estiver no client
  const shouldFetch = typeof window !== "undefined" && !!id;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/admin/order?orderId=${id}` : null,
    fetcher
  );

  // SSR/build: não renderiza nada que dependa do browser
  if (typeof window === "undefined") {
    return null;
  }

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-zinc-600">
        Carregando rota...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-zinc-600">
        Carregando pedido...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="card">
          <h1 className="text-lg font-semibold text-zinc-900">Erro ao carregar</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Não foi possível buscar os dados do pedido.
          </p>
          <button className="btn-outline press mt-4" onClick={() => router.back()}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Aqui é o ponto que evita o crash: data pode ser undefined
  if (!data?.order) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="card">
          <h1 className="text-lg font-semibold text-zinc-900">Pedido não encontrado</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Verifique se o ID está correto.
          </p>
          <button className="btn-outline press mt-4" onClick={() => router.push("/admin/pedidos")}>
            Voltar para pedidos
          </button>
        </div>
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Pedido #{String(order.id).slice(0, 8)}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="card space-y-1">
        <h2 className="font-medium text-zinc-900">Cliente</h2>
        <p className="text-zinc-800">{order.customer_name ?? "-"}</p>
        <p className="text-sm text-zinc-600">{order.email ?? "-"}</p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-medium text-zinc-900">Itens</h2>

        <table className="w-full text-sm">
          <thead className="border-b text-left text-zinc-700">
            <tr>
              <th className="py-2">Produto</th>
              <th className="py-2">Qtd (m)</th>
              <th className="py-2">Preço</th>
            </tr>
          </thead>

          <tbody>
            {(items ?? []).map((item: any) => (
              <tr key={item.id} className="border-b last:border-none">
                <td className="py-2">{item.product_name ?? item.name ?? "-"}</td>
                <td className="py-2">{item.meters ?? "-"} m</td>
                <td className="py-2">{money(Number(item.unit_price ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end text-lg font-semibold text-zinc-900">
        Total: {money(Number(order.total ?? 0))}
      </div>

      {order.status === "paid" && (
        <div className="card flex justify-end">
          <button
            className="btn-primary press"
            onClick={async () => {
              const r = await fetch("/api/admin/ship-automated", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
              });

              if (!r.ok) {
                alert("Falha ao gerar etiqueta.");
                return;
              }

              alert("Etiqueta gerada e e-mail enviado");
              router.reload();
            }}
          >
            Gerar etiqueta (1 clique)
          </button>
        </div>
      )}
    </div>
  );
}
