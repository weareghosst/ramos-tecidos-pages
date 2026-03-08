import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminOrder = {
  id: string;
  customer_name: string;
  status: string;
  total_price: number;
  shipping_price?: number;
  shipping_method?: string | null;
  created_at?: string;
};

function money(value: number) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
}

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      }
    });
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/products");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar pedidos");
        }

        if (!mounted) return;

        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Erro ao carregar pedidos");
        setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="p-8">Carregando pedidos...</p>;
  }

  if (error) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Pedido</th>
            <th className="text-left p-2">Cliente</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Total</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.length ? (
            orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.id}</td>
                <td className="p-2">{o.customer_name}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2 text-right">
                  {money(o.total_price)}
                </td>
                <td className="p-2 text-center">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="text-blue-600 underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-t">
              <td colSpan={5} className="p-4 text-center text-slate-500">
                Nenhum pedido encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}