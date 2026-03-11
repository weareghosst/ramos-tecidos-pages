import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    paid:      { label: "Pago",      color: "text-green-700 bg-green-100" },
    pending:   { label: "Pendente",  color: "text-yellow-700 bg-yellow-100" },
    shipped:   { label: "Enviado",   color: "text-blue-700 bg-blue-100" },
    cancelled: { label: "Cancelado", color: "text-red-700 bg-red-100" },
  };
  return map[status] || { label: status, color: "text-slate-700 bg-slate-100" };
}

export default function AdminOrders() {
  const { checking, authenticated, logout } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao carregar pedidos");
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir pedido");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(err?.message || "Erro ao excluir pedido.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (authenticated) loadOrders();
  }, [authenticated]);

  // aguarda verificação de sessão
  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;

  if (loading) return <div className="card p-6">Carregando pedidos...</div>;

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
          <p className="mt-2 text-slate-600">Acompanhe e gerencie os pedidos da loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/produtos" className="btn-outline px-4 py-2 rounded-lg">
            Gerenciar produtos
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-900 transition"
          >
            Sair
          </button>
        </div>
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
              {orders.map((o) => {
                const { label, color } = statusLabel(o.status);
                return (
                  <tr key={o.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{o.id}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{money(o.total_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/${o.id}`} className="font-medium text-slate-900 hover:text-slate-700">
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteOrder(o.id)}
                          disabled={deletingId === o.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-40"
                        >
                          {deletingId === o.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-6 text-slate-600">Nenhum pedido encontrado</div>
      )}
    </div>
  );
}
