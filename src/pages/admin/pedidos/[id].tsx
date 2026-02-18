import { useRouter } from "next/router";
import useSWR from "swr";
import { useState } from "react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminPedidoDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const { data, mutate } = useSWR(
    id ? `/api/admin/order?orderId=${id}` : null,
    fetcher
  );

  const [loading, setLoading] = useState(false);

  if (!id) return null;
  if (!data) return <div className="p-6">Carregando...</div>;

  const order = data.order;

  async function handleShip() {
    if (!confirm("Confirmar geração de etiqueta e envio do pedido?")) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/ship-automated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId: order.id })
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Erro ao gerar etiqueta");
        return;
      }

      await mutate();
      router.reload();

    } catch (err) {
      alert("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Pedido #{order.id}
      </h1>

      {/* Cliente */}
      <div className="card p-6 space-y-2">
        <h2 className="font-semibold text-lg">Cliente</h2>
        <p>{order.customer_name}</p>
        <p>{order.email}</p>
        <p>{order.phone}</p>
      </div>

      {/* Endereço */}
      <div className="card p-6 space-y-2">
        <h2 className="font-semibold text-lg">Endereço</h2>
        <p>{order.address}, {order.number}</p>
        <p>{order.district}</p>
        <p>{order.city} - {order.state}</p>
        <p>CEP: {order.cep}</p>
      </div>

      {/* Itens */}
      <div className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Itens</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">Qtd</th>
                <th className="text-left p-3">Preço</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">
                    R$ {Number(item.price || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo */}
      <div className="card p-6 space-y-2">
        <p>
          <strong>Status:</strong>{" "}
          <OrderStatusBadge status={order.status} />
        </p>

        <p>
          <strong>Total:</strong> R$ {Number(order.total || 0).toFixed(2)}
        </p>

        <p>
          <strong>Frete:</strong> R$ {Number(order.shipping_cost || 0).toFixed(2)}
        </p>
      </div>

      {/* Botão gerar etiqueta */}
      {order.status === "paid" && (
        <div className="card p-6 bg-green-50 border border-green-200">
          <button
            onClick={handleShip}
            disabled={loading}
            className={`btn-primary press ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading
              ? "Gerando etiqueta..."
              : "🚀 Gerar etiqueta e enviar pedido"}
          </button>
        </div>
      )}
    </div>
  );
}
