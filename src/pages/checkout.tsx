import Link from "next/link";
import { useEffect, useState } from "react";

type ShippingOption = {
  id: string;
  label: string;
  price: number;
  days_min: number;
  days_max: number;
};

export default function Checkout() {
  const cartKey = "ramos_cart_v1";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

  // Frete
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [shippingPrice, setShippingPrice] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCopyPaste, setQrCopyPaste] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem(cartKey) || "[]");
    if (!items.length) {
      // window.location.href = "/carrinho";
    }
  }, []);

  function cleanCep(v: string) {
    return v.replace(/\D/g, "").slice(0, 8);
  }

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: "Resposta inválida do servidor", raw: text };
    }
  }

  function calcItemsTotal(items: any[]) {
    return items.reduce((acc: number, i: any) => {
      const meters = Number(i.meters || 0);
      const ppm = Number(i.price_per_meter || 0);
      return acc + meters * ppm;
    }, 0);
  }

  async function quoteShipping(cepValue: string) {
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShippingId("");
    setShippingPrice(0);

    try {
      const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

      const r = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepValue, items }),
      });

      const j = await safeJson(r);
      if (!r.ok) throw new Error(j.error || "Erro ao cotar frete");

      setStreet(j?.address?.street || "");
      setDistrict(j?.address?.district || "");
      setCity(j?.address?.city || "");
      setStateUf(j?.address?.state || "");

      const opts: ShippingOption[] = j?.options || [];
      setShippingOptions(opts);

      if (opts.length) {
        setSelectedShippingId(opts[0].id);
        setShippingPrice(Number(opts[0].price || 0));
      }
    } catch (e: any) {
      setShippingError(e?.message || "Erro ao cotar frete");
    } finally {
      setShippingLoading(false);
    }
  }

  useEffect(() => {
    const c = cleanCep(cep);
    if (c.length === 8) {
      quoteShipping(c);
    } else {
      setShippingError(null);
      setShippingOptions([]);
      setSelectedShippingId("");
      setShippingPrice(0);
    }
  }, [cep]);

  function onSelectShipping(id: string) {
    setSelectedShippingId(id);
    const opt = shippingOptions.find((o) => o.id === id);
    setShippingPrice(opt ? Number(opt.price || 0) : 0);
  }

  async function handleCheckout() {
    setLoading(true);
    try {
      const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

      if (!items.length) throw new Error("Carrinho vazio.");
      if (!selectedShippingId) throw new Error("Selecione um frete.");

      const itemsTotal = calcItemsTotal(items);
      const total = itemsTotal + Number(shippingPrice || 0);
      if (total <= 0) throw new Error("Total inválido.");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          items,
          shipping_address: {
            cep: cleanCep(cep),
            street,
            number,
            complement: complement || null,
            district,
            city,
            state: stateUf,
          },
          shipping_price: shippingPrice,
          shipping_method: selectedShippingId,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");

      setOrderId(data.orderId);

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
          orderId: data.orderId,
          amount: total,
          payer,
        }),
      });

      const pix = await safeJson(pixRes);
      if (!pixRes.ok) throw new Error("Erro ao gerar Pix");

      setQrBase64(pix.qr_code_base64 || null);
      setQrCopyPaste(pix.qr_code || null);
      setStatus(pix.status || "pending");
    } catch (e: any) {
      alert(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orderId) return;

    const t = setInterval(async () => {
      const r = await fetch(`/api/order-status?orderId=${orderId}`);
      const j = await r.json();
      if (r.ok) {
        setStatus(j.status);
        if (j.status === "paid") clearInterval(t);
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
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Checkout</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/carrinho">Carrinho</Link>
          <Link href="/produtos">Produtos</Link>
        </nav>
      </header>

      {!orderId ? (
        <button onClick={handleCheckout} disabled={loading}>
          {loading ? "Gerando..." : "Finalizar e gerar Pix"}
        </button>
      ) : (
        <>
          <p>Pedido: <strong>{orderId}</strong></p>

          {status === "paid" ? (
            <div className="max-w-md mx-auto text-center mt-10">
              <h2 className="text-2xl font-bold text-green-600">
                Pagamento confirmado 🎉
              </h2>

              <p className="mt-4 text-gray-700">
                Enviamos um e-mail confirmando a sua compra.
              </p>

              <p className="text-gray-700">
                Todas as atualizações do pedido chegarão por e-mail.
              </p>

              <p className="mt-6 text-sm text-gray-500">
                Caso não encontre o e-mail, verifique sua caixa de spam.
              </p>
            </div>
          ) : (
            <>
              <h2>⏳ Aguardando pagamento...</h2>

              {qrBase64 && (
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  style={{ width: 240, marginTop: 16 }}
                />
              )}

              {qrCopyPaste && (
                <>
                  <button onClick={copyPix}>Copiar Pix</button>
                  <pre>{qrCopyPaste}</pre>
                </>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
