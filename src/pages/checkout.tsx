import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../shared/supabaseClient";


export default function Checkout() {
  const cartKey = "ramos_cart_v1";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCopyPaste, setQrCopyPaste] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem(cartKey) || "[]");
    if (!items.length) {
      // opcional: redirecionar pro carrinho
      // window.location.href = "/carrinho";
    }
  }, []);

  async function handleCheckout() {
    setLoading(true);
    try {
      const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

      // 1) cria pedido no Supabase
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          items
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");

      setOrderId(data.orderId);

      // 2) gera Pix no Mercado Pago
      const pixRes = await fetch("/api/mercadopago/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId })
      });

      const pixText = await pixRes.text();
let pix: any = {};
try { pix = JSON.parse(pixText); } catch { pix = { error: pixText }; }


      if (!pixRes.ok) throw new Error(pix.error || "Erro ao gerar Pix");

      setQrBase64(pix.qrCodeBase64);
      setQrCopyPaste(pix.qrCodeCopyPaste);
      setStatus(pix.status || "pending");
    } catch (e: any) {
      alert(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  // 3) fica consultando o status do pedido (pra mudar pra "paid" quando confirmar)
  useEffect(() => {
    if (!orderId) return;

    const t = setInterval(async () => {
      const r = await fetch(`/api/order-status?orderId=${orderId}`);
      const j = await r.json();
      if (r.ok) {
        setStatus(j.status);
        if (j.status === "paid") {
          clearInterval(t);
          // opcional: limpar carrinho quando confirmar pagamento
          // localStorage.removeItem(cartKey);
        }
      }
    }, 3000);

    return () => clearInterval(t);
  }, [orderId]);

  async function copyPix() {
    if (!qrCopyPaste) return;
    await navigator.clipboard.writeText(qrCopyPaste);
    alert("Pix copiado!");
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Checkout</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/carrinho">Carrinho</Link>
          <Link href="/produtos">Produtos</Link>
        </nav>
      </header>

      {!orderId ? (
        <>
          <p style={{ marginTop: 18 }}>Preencha seus dados para finalizar e gerar o Pix.</p>

          <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
            <input
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: 10 }}
            />
            <input
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10 }}
            />
            <input
              placeholder="WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ padding: 10 }}
            />

            <button
              onClick={handleCheckout}
              disabled={!name || !email || !phone || loading}
              style={{ padding: 12 }}
            >
              {loading ? "Gerando..." : "Finalizar e gerar Pix"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ marginTop: 18 }}>
            Pedido: <strong>{orderId}</strong>
          </p>

          {status === "paid" ? (
            <h2>✅ Pagamento confirmado!</h2>
          ) : (
            <h2>⏳ Aguardando pagamento...</h2>
          )}

          {qrBase64 && (
            <div style={{ marginTop: 16 }}>
              <img
                alt="QR Code Pix"
                src={`data:image/png;base64,${qrBase64}`}
                style={{ width: 240, height: 240, border: "1px solid #333", borderRadius: 12 }}
              />
            </div>
          )}

          {qrCopyPaste && (
            <div style={{ marginTop: 16, maxWidth: 520 }}>
              <button onClick={copyPix} style={{ padding: 10 }}>
                Copiar Pix
              </button>

              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  marginTop: 12,
                  padding: 12,
                  border: "1px solid #333",
                  borderRadius: 12
                }}
              >
                {qrCopyPaste}
              </pre>
            </div>
          )}
        </>
      )}
    </main>
  );
}
