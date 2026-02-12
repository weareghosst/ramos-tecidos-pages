import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminOrderDetail() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔄 Buscar pedido
  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      const r = await fetch(`/api/admin/order?orderId=${orderId}`);
      const j = await r.json();

      setOrder(j.order);
      setItems(j.items || []);
    }

    fetchOrder();
  }, [orderId]);

  // 🚀 1-CLIQUE AUTOMATIZADO
  async function shipAutomatically() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/ship-automated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao gerar etiqueta");
        return;
      }

      alert(
        `Pedido enviado com sucesso!\n\nRastreio: ${data.trackingCode}`
      );

      router.reload();
    } catch (err) {
      alert("Erro inesperado ao enviar pedido");
    } finally {
      setLoading(false);
    }
  }

  if (!order) {
    return (
      <main className="p-8">
        <p>Carregando pedido...</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">

      {/* 🔙 Voltar */}
      <Link href="/admin" className="text-sm text-gray-500">
        ← Voltar para pedidos
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">
        Pedido {order.id}
      </h1>

      {/* 👤 Cliente */}
      <section className="mb-6 border p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Cliente</h2>
        <p><strong>Nome:</strong> {order.customer_name}</p>
        <p><strong>Email:</strong> {order.email}</p>
        <p><strong>Telefone:</strong> {order.phone}</p>
      </section>

      {/* 📍 Endereço */}
      <section className="mb-6 border p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Endereço</h2>
        <p>
          {order.shipping_address?.street}, {order.shipping_address?.number}
        </p>
        <p>{order.shipping_address?.district}</p>
        <p>
          {order.shipping_address?.city} - {order.shipping_address?.state}
        </p>
        <p>CEP: {order.shipping_address?.cep}</p>
      </section>

      {/* 📦 Itens */}
      <section className="mb-6 border p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Itens</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Produto</th>
              <th className="text-center p-2">Qtd</th>
              <th className="text-right p-2">Preço</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.product_name}</td>
                <td className="text-center p-2">{i.quantity}</td>
                <td className="text-right p-2">
                  R$ {(i.price / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 💰 Resumo */}
      <section className="mb-6 border p-4 rounded-lg">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> R$ {(order.total_price / 100).toFixed(2)}</p>
        <p><strong>Frete:</strong> {order.shipping_method}</p>
      </section>

      {/* 🚀 BOTÃO AUTOMÁTICO */}
      {order.status === "paid" && !order.shipped_at && (
        <section className="border p-6 rounded-lg bg-green-50">
          <h2 className="font-semibold mb-4">
            Enviar pedido automaticamente
          </h2>

          <button
            onClick={shipAutomatically}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg transition"
          >
            {loading
              ? "Processando envio..."
              : "🚀 Gerar etiqueta e enviar pedido"}
          </button>
        </section>
      )}

      {/* 📦 Já enviado */}
      {order.shipped_at && (
        <section className="mt-8 border p-6 rounded-lg bg-blue-50">
          <h2 className="font-semibold mb-3">Pedido enviado</h2>

          <p>
            <strong>Enviado em:</strong>{" "}
            {new Date(order.shipped_at).toLocaleString()}
          </p>

          <p>
            <strong>Rastreio:</strong> {order.tracking_code}
          </p>

          {order.label_url && (
            <p className="mt-2">
              <a
                href={order.label_url}
                target="_blank"
                className="text-blue-600 underline"
              >
                📄 Baixar etiqueta
              </a>
            </p>
          )}
        </section>
      )}

    </main>
  );
}
