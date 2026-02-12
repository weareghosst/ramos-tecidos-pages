import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Status</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{o.status}</td>
              <td>R$ {(o.total_price / 100).toFixed(2)}</td>
              <td>
                <Link href={`/admin/${o.id}`}>
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
