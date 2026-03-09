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
    return <div className="card p-6">Carregando pedidos...</div>;
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Erro</h2>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="mt-2 text-slate-600">
            Acompanhe e gerencie os pedidos da loja.
          </p>
        </div>

        <Link href="/admin/produtos" className="btn-outline px-4 py-2 rounded-lg">
          Gerenciar produtos
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{o.id}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{money(o.total_price)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${o.id}`}
                      className="font-medium text-slate-900 hover:text-slate-700"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-6 text-slate-600">Nenhum pedido encontrado</div>
      )}
    </div>
  );
}