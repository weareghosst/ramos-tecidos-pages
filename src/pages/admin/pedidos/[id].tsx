import { useRouter } from "next/router";
import useSWR from "swr";
import { useState } from "react";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

const fetcher = (url: string) => fetch(url).then(res => res.json());

function money(value: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

function getItemName(item: any) {
  return (
    item.product_name ||
    item.product?.name ||
    item.products?.name ||
    item.name ||
    "Produto"
  );
}

function getItemQuantity(item: any) {
  return Number(
    item.quantity ??
    item.qty ??
    item.meters ??
    0
  );
}

function getItemTotal(item: any) {
  if (typeof item.price === "number") {
    return item.price > 1000 ? item.price / 100 : item.price;
  }

  const meters = Number(item.meters || item.quantity || 0);
  const ppm = Number(item.price_per_meter || item.unit_price || 0);

  return meters * ppm;
}

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
  const shippingAddress = order.shipping_address || {};

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

      <div className="card p-6 space-y-2">
        <h2 className="font-semibold text-lg">Cliente</h2>
        <p>{order.customer_name}</p>
        <p>{order.email}</p>
        <p>{order.phone}</p>
      </div>

      <div className="card p-6 space-y-2">
        <h2 className="font-semibold text-lg">Endereço</h2>
        <p>{shippingAddress.street}, {shippingAddress.number}</p>
        <p>{shippingAddress.district}</p>
        <p>{shippingAddress.city} - {shippingAddress.state}</p>
        <p>CEP: {shippingAddress.cep}</p>
      </div>

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
              {order.items?.length ? (
                order.items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="border-t">
                    <td className="p-3">{getItemName(item)}</td>
                    <td className="p-3">{getItemQuantity(item)}</td>
                    <td className="p-3">{money(getItemTotal(item))}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td className="p-3" colSpan={3}>
                    Nenhum item encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 space-y-2">
        <p>
          <strong>Status:</strong>{" "}
          <OrderStatusBadge status={order.status} />
        </p>

        <p>
          <strong>Total:</strong> {money(Number(order.total_price || order.total || 0))}
        </p>

        <p>
          <strong>Frete:</strong> {money(Number(order.shipping_price || order.shipping_cost || 0))}
        </p>
      </div>

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