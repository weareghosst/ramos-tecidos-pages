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

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");

  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [shippingPrice, setShippingPrice] = useState(0);

  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCopyPaste, setQrCopyPaste] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  function cleanCep(v: string) {
    return v.replace(/\D/g, "").slice(0, 8);
  }

  async function quoteShipping(c: string) {
    setShippingLoading(true);

    const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

    const r = await fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: c, items }),
    });

    const j = await r.json();

    setStreet(j.address.street);
    setDistrict(j.address.district);
    setCity(j.address.city);
    setStateUf(j.address.state);
    setShippingOptions(j.options || []);

    if (j.options?.length) {
      setSelectedShippingId(j.options[0].id);
      setShippingPrice(j.options[0].price);
    }

    setShippingLoading(false);
  }

  useEffect(() => {
    const c = cleanCep(cep);
    if (c.length === 8) quoteShipping(c);
  }, [cep]);

  async function handleCheckout() {
    setLoading(true);

    const items = JSON.parse(localStorage.getItem(cartKey) || "[]");

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
          complement,
          district,
          city,
          state: stateUf,
        },
        shipping_price: shippingPrice,
        shipping_method: selectedShippingId,
      }),
    });

    const data = await res.json();
    setOrderId(data.orderId);

    const pix = await fetch("/api/mercadopago/create-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: data.orderId,
        amount: data.total,
        payer: { email, first_name: name },
      }),
    }).then((r) => r.json());

    setQrBase64(pix.qr_code_base64);
    setQrCopyPaste(pix.qr_code);
    setStatus(pix.status);

    setLoading(false);
  }

  useEffect(() => {
    if (!orderId) return;

    const t = setInterval(async () => {
      const r = await fetch(`/api/order-status?orderId=${orderId}`);
      const j = await r.json();
      setStatus(j.status);
      if (j.status === "paid") clearInterval(t);
    }, 3000);

    return () => clearInterval(t);
  }, [orderId]);

  return (
    <main className="max-w-3xl mx-auto p-6 text-white">
      <header className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Checkout</h1>
        <nav className="flex gap-4">
          <Link href="/carrinho">Carrinho</Link>
          <Link href="/produtos">Produtos</Link>
        </nav>
      </header>

      {!orderId ? (
        <div className="grid gap-3 max-w-md">
          <input placeholder="Nome" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Telefone" onChange={(e) => setPhone(e.target.value)} />

          <input placeholder="CEP" onChange={(e) => setCep(cleanCep(e.target.value))} />
          <input placeholder="Rua" value={street} onChange={(e) => setStreet(e.target.value)} />
          <input placeholder="Número" onChange={(e) => setNumber(e.target.value)} />
          <input placeholder="Bairro" value={district} onChange={(e) => setDistrict(e.target.value)} />
          <input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
          <input placeholder="UF" value={stateUf} onChange={(e) => setStateUf(e.target.value)} />

          {shippingLoading && <p>Cotando frete...</p>}

          {shippingOptions.map((opt) => (
            <label key={opt.id}>
              <input
                type="radio"
                checked={selectedShippingId === opt.id}
                onChange={() => {
                  setSelectedShippingId(opt.id);
                  setShippingPrice(opt.price);
                }}
              />
              {opt.label} – R$ {opt.price.toFixed(2)}
            </label>
          ))}

          <button onClick={handleCheckout} disabled={loading}>
            {loading ? "Gerando..." : "Finalizar e gerar Pix"}
          </button>
        </div>
      ) : (
        <>
          {status === "paid" ? (
            <div className="text-center mt-10">
              <h2 className="text-2xl text-green-500 font-bold">
                Pagamento confirmado 🎉
              </h2>
              <p className="mt-3">Enviamos um e-mail confirmando sua compra.</p>
            </div>
          ) : (
            <>
              <h2>Aguardando pagamento...</h2>
              {qrBase64 && (
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  className="mt-4 w-56"
                />
              )}
              {qrCopyPaste && (
                <pre className="mt-4">{qrCopyPaste}</pre>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
