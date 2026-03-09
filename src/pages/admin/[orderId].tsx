import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  color_name: string | null;
  meters: number;
  price_per_meter: number;
  price: number;
  product?: {
    id?: string;
    name?: string;
    slug?: string;
  } | null;
};

type Order = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  status: string;
  total_price: number;
  shipping_price: number;
  shipping_method: string | null;
  shipping_status: string | null;
  tracking_code: string | null;
  shipping_address: any;
  created_at: string;
  items: OrderItem[];
};

type Props = {
  order: Order | null;
};

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

export default function AdminOrderDetailsPage({ order }: Props) {
  const [loadingShip, setLoadingShip] = useState(false);

  if (!order) {
    return <div className="card p-6">Pedido não encontrado.</div>;
  }

  const safeOrder = order;

  async function handleGenerateLabel() {
    try {
      setLoadingShip(true);

      const res = await fetch("/api/admin/ship-automated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: safeOrder.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao gerar etiqueta");
      }

      alert("Etiqueta/processo de envio iniciado com sucesso.");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Erro ao gerar etiqueta");
    } finally {
      setLoadingShip(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedido</h1>
          <p className="mt-2 text-slate-600">{safeOrder.id}</p>
        </div>

        <Link href="/admin" className="btn-outline px-4 py-2 rounded-lg">
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Cliente</h2>
          <p><strong>Nome:</strong> {safeOrder.customer_name}</p>
          <p><strong>Email:</strong> {safeOrder.email}</p>
          <p><strong>Telefone:</strong> {safeOrder.phone}</p>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Pedido</h2>
          <p><strong>Status:</strong> {safeOrder.status}</p>
          <p><strong>Total:</strong> {money(safeOrder.total_price)}</p>
          <p><strong>Frete:</strong> {money(safeOrder.shipping_price)}</p>
          <p><strong>Método:</strong> {safeOrder.shipping_method || "-"}</p>
          <p><strong>Status do envio:</strong> {safeOrder.shipping_status || "-"}</p>
          <p><strong>Código de rastreio:</strong> {safeOrder.tracking_code || "-"}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Endereço</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p><strong>CEP:</strong> {safeOrder.shipping_address?.cep || "-"}</p>
          <p><strong>Rua:</strong> {safeOrder.shipping_address?.street || "-"}</p>
          <p><strong>Número:</strong> {safeOrder.shipping_address?.number || "-"}</p>
          <p><strong>Complemento:</strong> {safeOrder.shipping_address?.complement || "-"}</p>
          <p><strong>Bairro:</strong> {safeOrder.shipping_address?.district || "-"}</p>
          <p><strong>Cidade:</strong> {safeOrder.shipping_address?.city || "-"}</p>
          <p><strong>UF:</strong> {safeOrder.shipping_address?.state || "-"}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Itens</h2>

          <button
            type="button"
            onClick={handleGenerateLabel}
            disabled={loadingShip}
            className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loadingShip ? "Gerando..." : "Gerar etiqueta"}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {safeOrder.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">
                {item.product?.name || "Produto"}
              </p>

              {item.color_name ? (
                <p className="mt-1 text-sm text-slate-600">
                  Cor: <strong>{item.color_name}</strong>
                </p>
              ) : null}

              <p className="mt-1 text-sm text-slate-600">
                Metragem: {Number(item.meters).toFixed(2)} m
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Preço por metro: {money(item.price_per_meter)}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Subtotal: {money(item.price)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const orderId = String(ctx.params?.orderId || "");

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      email,
      phone,
      status,
      total_price,
      shipping_price,
      shipping_method,
      shipping_status,
      tracking_code,
      shipping_address,
      created_at,
      items:order_items(
        id,
        product_id,
        variant_id,
        color_name,
        meters,
        price_per_meter,
        price,
        product:products(
          id,
          name,
          slug
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return {
      props: {
        order: null,
      },
    };
  }

  return {
    props: {
      order: data as Order,
    },
  };
};