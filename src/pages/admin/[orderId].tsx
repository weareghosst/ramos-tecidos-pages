import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type OrderItem = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  color_name: string | null;
  meters: number;
  price_per_meter: number;
  price: number;
  product?: { id?: string; name?: string; slug?: string } | null;
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

type Props = { order: Order | null };

function money(v: number) { return `R$ ${Number(v || 0).toFixed(2)}`; }

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    paid:      { label: "Pago",      color: "text-green-700 bg-green-100" },
    pending:   { label: "Pendente",  color: "text-yellow-700 bg-yellow-100" },
    shipped:   { label: "Enviado",   color: "text-blue-700 bg-blue-100" },
    cancelled: { label: "Cancelado", color: "text-red-700 bg-red-100" },
  };
  return map[status] || { label: status, color: "text-slate-700 bg-slate-100" };
}

export default function AdminOrderDetailsPage({ order }: Props) {
  const { checking, authenticated } = useAdminAuth();
  const [loadingShip, setLoadingShip] = useState(false);
  const [trackingCode, setTrackingCode] = useState(order?.tracking_code || "");
  const [sendingTracking, setSendingTracking] = useState(false);
  const [trackingSent, setTrackingSent] = useState(false);

  if (checking) return <div className="card p-6">Verificando acesso...</div>;
  if (!authenticated) return null;
  if (!order) return <div className="card p-6">Pedido não encontrado.</div>;

  const { label, color } = statusLabel(order.status);

  async function handleGenerateLabel() {
    try {
      setLoadingShip(true);
      const res = await fetch("/api/admin/ship-automated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order!.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao gerar etiqueta");
      alert("Etiqueta gerada com sucesso!");
      window.location.reload();
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar etiqueta");
    } finally {
      setLoadingShip(false);
    }
  }

  async function handleSendTracking() {
    if (!trackingCode.trim()) { alert("Informe o código de rastreio antes de enviar."); return; }
    try {
      setSendingTracking(true);
      const res = await fetch("/api/admin/send-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order!.id, trackingCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao enviar rastreio");
      setTrackingSent(true);
      alert(`E-mail enviado para ${order!.email}!`);
      window.location.reload();
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar e-mail de rastreio");
    } finally {
      setSendingTracking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedido</h1>
          <p className="mt-2 text-slate-600">{order.id}</p>
        </div>
        <Link href="/admin" className="btn-outline px-4 py-2 rounded-lg">Voltar</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Cliente</h2>
          <p><strong>Nome:</strong> {order.customer_name}</p>
          <p><strong>Email:</strong> {order.email}</p>
          <p><strong>Telefone:</strong> {order.phone}</p>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Pedido</h2>
          <p><strong>Status:</strong> <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>{label}</span></p>
          <p><strong>Total:</strong> {money(order.total_price)}</p>
          <p><strong>Frete:</strong> {money(order.shipping_price)}</p>
          <p><strong>Método:</strong> {order.shipping_method || "-"}</p>
          <p><strong>Status do envio:</strong> {order.shipping_status || "-"}</p>
          <p><strong>Código de rastreio:</strong> {order.tracking_code ? <span className="font-mono font-semibold">{order.tracking_code}</span> : "-"}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Endereço</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p><strong>CEP:</strong> {order.shipping_address?.cep || "-"}</p>
          <p><strong>Rua:</strong> {order.shipping_address?.street || "-"}</p>
          <p><strong>Número:</strong> {order.shipping_address?.number || "-"}</p>
          <p><strong>Complemento:</strong> {order.shipping_address?.complement || "-"}</p>
          <p><strong>Bairro:</strong> {order.shipping_address?.district || "-"}</p>
          <p><strong>Cidade:</strong> {order.shipping_address?.city || "-"}</p>
          <p><strong>UF:</strong> {order.shipping_address?.state || "-"}</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Enviar código de rastreio</h2>
        <p className="text-sm text-slate-500">Cole o código gerado pelo Melhor Envio e clique em enviar.</p>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Ex.: BR123456789BR"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono uppercase outline-none focus:border-slate-400"
          />
          <button type="button" onClick={handleSendTracking} disabled={sendingTracking || trackingSent} className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50 whitespace-nowrap">
            {sendingTracking ? "Enviando..." : trackingSent ? "Enviado ✓" : "Enviar e-mail"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Itens</h2>
          <button type="button" onClick={handleGenerateLabel} disabled={loadingShip} className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50">
            {loadingShip ? "Gerando..." : "Gerar etiqueta"}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">{item.product?.name || "Produto"}</p>
              {item.color_name ? <p className="mt-1 text-sm text-slate-600">Cor: <strong>{item.color_name}</strong></p> : null}
              <p className="mt-1 text-sm text-slate-600">Metragem: {Number(item.meters).toFixed(2)} m</p>
              <p className="mt-1 text-sm text-slate-600">Preço por metro: {money(item.price_per_meter)}</p>
              <p className="mt-1 text-sm text-slate-600">Subtotal: {money(item.price)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const orderId = String(ctx.params?.orderId || "");
  const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  const { data, error } = await supabase.from("orders").select(`id,customer_name,email,phone,status,total_price,shipping_price,shipping_method,shipping_status,tracking_code,shipping_address,created_at,items:order_items(id,product_id,variant_id,color_name,meters,price_per_meter,price,product:products(id,name,slug))`).eq("id", orderId).single();
  if (error || !data) return { props: { order: null } };
  return { props: { order: data as Order } };
};
