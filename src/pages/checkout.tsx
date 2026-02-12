import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

  const items = useMemo(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(cartKey) || "[]");
  }, [orderId]); // muda quando cria pedido, mas ok

  const itemsTotal = useMemo(() => calcItemsTotal(items), [items]);
  const total = useMemo(() => itemsTotal + Number(shippingPrice || 0), [itemsTotal, shippingPrice]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!items.length) {
        alert("Carrinho vazio.");
        return;
      }

      if (!selectedShippingId) {
        alert("Selecione uma opção de frete.");
        return;
      }

      if (!total || total <= 0) {
        alert("Total inválido. Verifique carrinho e frete.");
        return;
      }

      // 1) cria pedido com endereço + frete
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

      const createdOrderId = data.orderId as string;
      if (!createdOrderId) throw new Error("API /api/orders não retornou orderId");

      setOrderId(createdOrderId);

      // 2) gera Pix com total (itens + frete)
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
        alert("Erro do Pix:\n" + JSON.stringify(pix, null, 2));
        throw new Error(pix?.mp_message || pix?.error || "Erro ao gerar Pix");
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

  const disabled =
    !name ||
    !email ||
    !phone ||
    cleanCep(cep).length !== 8 ||
    !street ||
    !number ||
    !district ||
    !city ||
    !stateUf ||
    !selectedShippingId ||
    loading;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Topbar simples */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-tight text-lg">
            Ramos Tecidos
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/produtos" className="hover:text-slate-700">
              Produtos
            </Link>
            <Link
              href="/carrinho"
              className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
            >
              Carrinho
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Coluna esquerda */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h1 className="text-xl font-bold">Checkout</h1>
              <p className="text-slate-600 mt-1">
                Preencha seus dados e endereço para finalizar e gerar o Pix.
              </p>

              {!orderId ? (
                <div className="mt-6 grid gap-4">
                  {/* Dados */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Nome completo</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">E-mail</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h2 className="font-semibold">Endereço</h2>
                    <p className="text-sm text-slate-600">
                      Digite o CEP para cotar frete e preencher o endereço.
                    </p>

                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">CEP</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="00000000"
                          value={cep}
                          onChange={(e) => setCep(cleanCep(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">UF</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="SP"
                          value={stateUf}
                          onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Rua</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="Rua..."
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Número</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="123"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Complemento (opcional)</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="Apto, bloco..."
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Bairro</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="Bairro..."
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Cidade</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          placeholder="Cidade..."
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Frete */}
                    <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">Frete</p>
                        {shippingLoading ? (
                          <span className="text-sm text-slate-500">Cotando…</span>
                        ) : null}
                      </div>

                      {shippingError ? (
                        <p className="text-sm text-red-600 mt-2">{shippingError}</p>
                      ) : null}

                      {shippingOptions.length === 0 ? (
                        <p className="text-sm text-slate-600 mt-2">
                          Informe um CEP válido para ver opções.
                        </p>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          {shippingOptions.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="shipping"
                                className="mt-1"
                                checked={selectedShippingId === opt.id}
                                onChange={() => onSelectShipping(opt.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{opt.label}</p>
                                <p className="text-sm text-slate-600">
                                  R$ {Number(opt.price).toFixed(2)} • {opt.days_min}-{opt.days_max} dias
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={disabled}
                      className="mt-5 w-full rounded-xl px-4 py-3 font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                    >
                      {loading ? "Gerando..." : "Finalizar e gerar Pix"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-sm text-slate-600">
                    Pedido: <span className="font-semibold text-slate-900">{orderId}</span>
                  </p>

                  {status === "paid" ? (
                    <div className="mt-6 text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                      <h2 className="text-2xl font-bold text-green-700">
                        Pagamento confirmado 🎉
                      </h2>

                      <p className="mt-3 text-slate-700">
                        Enviamos um e-mail confirmando a sua compra.
                      </p>

                      <p className="text-slate-700">
                        Todas as atualizações do pedido chegarão por e-mail.
                      </p>

                      <p className="mt-4 text-sm text-slate-500">
                        Se não encontrar, verifique a caixa de spam.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Aguardando pagamento…</h2>
                        <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
                          pending
                        </span>
                      </div>

                      {qrBase64 && (
                        <div className="mt-4 flex justify-center">
                          <img
                            alt="QR Code Pix"
                            src={`data:image/png;base64,${qrBase64}`}
                            className="w-56 h-56 rounded-xl border border-slate-200"
                          />
                        </div>
                      )}

                      {qrCopyPaste && (
                        <div className="mt-4">
                          <button
                            onClick={copyPix}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 transition"
                          >
                            Copiar Pix
                          </button>

                          <pre className="mt-3 text-xs whitespace-pre-wrap break-all rounded-xl border border-slate-200 p-3 bg-slate-50">
                            {qrCopyPaste}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita: resumo */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:sticky lg:top-6">
              <h2 className="font-semibold">Resumo</h2>
              <p className="text-sm text-slate-600 mt-1">Revise antes de pagar.</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal (itens)</span>
                  <span className="font-medium">R$ {Number(itemsTotal || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Frete</span>
                  <span className="font-medium">R$ {Number(shippingPrice || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Método</span>
                  <span className="font-medium">{selectedShippingId || "-"}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 mt-4 pt-4 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">R$ {Number(total || 0).toFixed(2)}</span>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Após o pagamento, você receberá as atualizações do pedido por e-mail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
