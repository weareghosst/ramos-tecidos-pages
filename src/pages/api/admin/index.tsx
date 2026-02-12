import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔒 BLOQUEIO ADMIN
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      }
    });
  }, [router]);

  // 📦 Buscar pedidos
  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-8">Carregando pedidos...</p>;
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
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{o.id}</td>
              <td className="p-2">{o.customer_name}</td>
              <td className="p-2">{o.status}</td>
              <td className="p-2 text-right">
                R$ {(o.total_price / 100).toFixed(2)}
              </td>
              <td className="p-2 text-center">
                <Link
                  href={`/admin/${o.id}`}
                  className="text-blue-600 underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
