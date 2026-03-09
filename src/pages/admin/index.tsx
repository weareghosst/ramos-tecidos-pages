import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  color_name?: string | null;
  meters: number;
  price_per_meter: number;
  price: number;
  product?: {
    name?: string;
  } | null;
};

type Order = {
  id: string;
  customer_name: string;
  status: string;
  total_price: number;
  shipping_price?: number;
  shipping_method?: string;
  created_at?: string;
  items?: OrderItem[];
};

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
            Acompanhe os pedidos realizados na loja.
          </p>
        </div>

        <Link href="/admin/produtos" className="btn-outline px-4 py-2 rounded-lg">
          Gerenciar produtos
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pedido</p>
                  <p className="font-semibold text-slate-900">{o.id}</p>

                  <p className="mt-3 text-sm text-slate-500">Cliente</p>
                  <p className="font-medium text-slate-900">{o.customer_name}</p>
                </div>

                <div className="grid gap-2 text-sm md:text-right">
                  <div>
                    <span className="text-slate-500">Status: </span>
                    <strong>{o.status}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500">Total: </span>
                    <strong>{money(o.total_price)}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500">Frete: </span>
                    <strong>{money(o.shipping_price || 0)}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500">Método: </span>
                    <strong>{o.shipping_method || "-"}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500">Criado em: </span>
                    <strong>{formatDate(o.created_at)}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-900">Itens</p>

                {o.items && o.items.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {o.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <p className="font-medium text-slate-900">
                          {item.product?.name || "Produto"}
                        </p>

                        {item.color_name ? (
                          <p className="mt-1 text-sm text-slate-600">
                            Cor: <strong>{item.color_name}</strong>
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm text-slate-600">
                          Metragem: {Number(item.meters).toFixed(1)} m
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Preço por metro: {money(item.price_per_meter)}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Subtotal do item: {money(item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Nenhum item encontrado para este pedido.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-slate-600">Nenhum pedido encontrado</div>
      )}
    </div>
  );
}