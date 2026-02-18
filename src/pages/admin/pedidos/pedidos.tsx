import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminPedidos() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useSWR(
    `/api/admin/orders?status=${statusFilter}`,
    fetcher
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Pedidos
      </h1>

      {/* Filtro */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "paid", "shipped"].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn-outline ${
              statusFilter === status ? "bg-gray-100" : ""
            }`}
          >
            {status === "all" ? "Todos" : status}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-6">
                    <div className="skeleton h-6 w-full" />
                  </td>
                </tr>
              )}

              {data?.orders?.map((order: any) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3 font-mono text-xs">
                    {order.id}
                  </td>

                  <td className="p-3">
                    {order.customer_name}
                  </td>

                  <td className="p-3">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3 font-semibold">
                    R$ {order.total.toFixed(2)}
                  </td>

                  <td className="p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>

                  <td className="p-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="btn-primary press text-xs"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}

              {!isLoading && data?.orders?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
