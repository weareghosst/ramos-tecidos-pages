import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  customer_name: string;
  status: string;
  total_price: number;
  shipping_price?: number;
  shipping_method?: string;
  created_at?: string;
};

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/orders");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar pedidos");
      }

      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando pedidos...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>Pedidos</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f3f3f3" }}>
            <th style={{ textAlign: "left", padding: 10 }}>Pedido</th>
            <th style={{ textAlign: "left", padding: 10 }}>Cliente</th>
            <th style={{ textAlign: "left", padding: 10 }}>Status</th>
            <th style={{ textAlign: "right", padding: 10 }}>Total</th>
            <th style={{ padding: 10 }}></th>
          </tr>
        </thead>

        <tbody>
          {orders.length > 0 ? (
            orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: 10 }}>{o.id}</td>
                <td style={{ padding: 10 }}>{o.customer_name}</td>
                <td style={{ padding: 10 }}>{o.status}</td>
                <td style={{ padding: 10, textAlign: "right" }}>
                  {money(o.total_price)}
                </td>

                <td style={{ padding: 10 }}>
                  <Link href={`/admin/pedidos/${o.id}`}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ padding: 20, textAlign: "center" }}>
                Nenhum pedido encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}