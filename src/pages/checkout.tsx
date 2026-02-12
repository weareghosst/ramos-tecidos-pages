import Link from "next/link";
import { useEffect, useState } from "react";

export default function Checkout() {
  const cartKey = "ramos_cart_v1";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Endereço (frete fase 1)
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

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

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: "Resposta inválida do servidor", raw: text };
    }
  }

  function calcTotal(items: any[]) {
    return items.reduce((acc: number, i: any) => {
      const meters = Number(i.meters || 0);
      const ppm = Number(i.price_per_meter || 0);
      return acc + meters * ppm;
    }, 0);
  }

  async function handleCheckout() {
    setLoading(true);
    try {
      const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

      if (!items.length) {
        alert("Carrinho vazio.");
        return;
      }

      const itemsTotal = calcTotal(items);

      // Fase 1: frete = 0 (a calcular)
      const shippingPrice = 0;
      const total = itemsTotal + shippingPrice;

      if (!total || total <= 0) {
        alert("Total inválido no carrinho. Verifique metros e preço por metro.");
        return;
      }

      // 1) cria pedido (agora com endereço)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          items,
          shipping_address: {
            cep,
            street,
            number,
            complement: complement || null,
            district,
            city,
            state: stateUf,
          },
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");

      const createdOrderId = data.orderId as string;
      if (!createdOrderId) throw new Error("API /api/orders não retornou orderId");

      setOrderId(createdOrderId);

      // 2) gera Pix
      const [first, ...rest] = name.trim().split(/\s+/);
      const payer = {
        email,
        first_name: first || name,
        last_name: rest.join(" ") || "Cliente",
      };

      const pixRes = await fetch("/api/mercadopago/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrderId,
          amount: total,
          payer,
        }),
      });

      const pix = await safeJson(pixRes);
      if (!pixRes.ok) {
        const msg =
          pix?.mp_message ||
          pix?.error ||
          pix?.details?.message ||
          "Erro ao gerar Pix";
        throw new Error(msg);
      }

      setQrBase64(pix.qr_code_base64 || null);
      setQrCopyPaste(pix.qr_code || null);
      setStatus(pix.status || "pending");
    } catch (e: any) {
      alert(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  // consulta status do pedido (mantém por enquanto)
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

  const disabled =
    !name || !email || !phone ||
    !cep || !street || !number || !district || !city || !stateUf ||
    loading;

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
          <p style={{ marginTop: 18 }}>
            Preencha seus dados e endereço para finalizar e gerar o Pix.
          </p>

          <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
            <input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: 10 }} />

            <hr style={{ opacity: 0.2 }} />

            <input placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="Rua" value={street} onChange={(e) => setStreet(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="Número" value={number} onChange={(e) => setNumber(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="Complemento (opcional)" value={complement} onChange={(e) => setComplement(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="Bairro" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} style={{ padding: 10 }} />
            <input placeholder="UF (ex: SP)" value={stateUf} onChange={(e) => setStateUf(e.target.value)} style={{ padding: 10 }} />

            <button onClick={handleCheckout} disabled={disabled} style={{ padding: 12 }}>
              {loading ? "Gerando..." : "Finalizar e gerar Pix"}
            </button>

            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              Frete: <strong>a calcular</strong> (por enquanto)
            </p>
          </div>
        </>
      ) : (
        <>
          <p style={{ marginTop: 18 }}>
            Pedido: <strong>{orderId}</strong>
          </p>

          {status === "paid" ? <h2>✅ Pagamento confirmado!</h2> : <h2>⏳ Aguardando pagamento...</h2>}

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
                  borderRadius: 12,
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
