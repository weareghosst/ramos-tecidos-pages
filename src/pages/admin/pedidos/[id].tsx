import { useRouter } from "next/router";
import useSWR from "swr";
import OrderStatusBadge from "../../../components/admin/OrderStatusBadge";


const fetcher = (url: string) => fetch(url).then(r => r.json());

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminPedidoDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading } = useSWR(
    id ? `/api/admin/order?orderId=${id}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-10 text-sm text-zinc-500">
        Carregando pedido...
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Pedido #{order.id.slice(0, 8)}
        </h1>

        <OrderStatusBadge status={order.status} />
      </div>

      {/* Cliente */}
      <div className="card space-y-1">
        <h2 className="font-medium">Cliente</h2>
        <p>{order.customer_name}</p>
        <p className="text-sm text-zinc-600">{order.email}</p>
      </div>

      {/* Itens */}
      <div className="card">
        <h2 className="mb-3 font-medium">Itens</h2>

        <table className="w-full text-sm">
          <thead className="border-b text-left">
            <tr>
              <th className="py-2">Produto</th>
              <th className="py-2">Qtd (m)</th>
              <th className="py-2">Preço</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b last:border-none">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2">{item.meters} m</td>
                <td className="py-2">{money(item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end text-lg font-semibold">
        Total: {money(order.total)}
      </div>

      {/* Ações */}
      {order.status === "paid" && (
        <div className="card flex justify-end">
          <button
            className="btn-primary press"
            onClick={async () => {
              await fetch("/api/admin/ship-automated", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
              });

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
