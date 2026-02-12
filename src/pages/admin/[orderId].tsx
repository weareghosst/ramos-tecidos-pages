import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminOrderDetail() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔒 BLOQUEIO ADMIN
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      }
    });
  }, [router]);

  // 🔄 Buscar pedido
  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/admin/order?orderId=${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order);
        setItems(data.items || []);
      });
  }, [orderId]);

  // 🚀 AUTOMAÇÃO 1 CLIQUE
  async function shipAutomatically() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/ship-automated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao gerar etiqueta");
        return;
      }

      alert(`Pedido enviado com sucesso!\nRastreio: ${data.trackingCode}`);
      router.reload();
    } catch {
      alert("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (!order) {
    return <p className="p-8">Carregando pedido...</p>;
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <Link href="/admin" className="text-sm text-gray-500">
        ← Voltar
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">
        Pedido {order.id}
      </h1>

      {/* CLIENTE */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Cliente</h2>
        <p>{order.customer_name}</p>
        <p>{order.email}</p>
        <p>{order.phone}</p>
      </section>

      {/* ENDEREÇO */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Endereço</h2>
        <p>
          {order.shipping_address.street},{" "}
          {order.shipping_address.number}
        </p>
        <p>{order.shipping_address.district}</p>
        <p>
          {order.shipping_address.city} -{" "}
          {order.shipping_address.state}
        </p>
        <p>CEP: {order.shipping_address.cep}</p>
      </section>

      {/* ITENS */}
      <section className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Itens</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Produto</th>
              <th className="p-2 text-center">Qtd</th>
              <th className="p-2 text-right">Preço</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.product_name}</td>
                <td className="p-2 text-center">{i.quantity}</td>
                <td className="p-2 text-right">
                  R$ {(i.price / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* RESUMO */}
      <section className="mb-6 border p-4 rounded">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> R$ {(order.total_price / 100).toFixed(2)}</p>
        <p><strong>Frete:</strong> {order.shipping_method}</p>
      </section>

      {/* BOTÃO 1 CLIQUE */}
      {order.status === "paid" && !order.shipped_at && (
        <section className="border p-6 rounded bg-green-50">
          <button
            onClick={shipAutomatically}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {loading
              ? "Processando envio..."
              : "🚀 Gerar etiqueta e enviar pedido"}
          </button>
        </section>
      )}

      {/* ENVIADO */}
      {order.shipped_at && (
        <section className="mt-6 border p-6 rounded bg-blue-50">
          <p>
            <strong>Enviado em:</strong>{" "}
            {new Date(order.shipped_at).toLocaleString()}
          </p>
          <p>
            <strong>Rastreio:</strong> {order.tracking_code}
          </p>

          {order.label_url && (
            <a
              href={order.label_url}
              target="_blank"
              className="text-blue-600 underline"
            >
              📄 Baixar etiqueta
            </a>
          )}
        </section>
      )}
    </main>
  );
}
