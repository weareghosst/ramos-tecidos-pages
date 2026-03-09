import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart, clearCart } from "@/lib/cart";
import type { CartItem } from "@/types/catalog";

type ShippingOption = {
  id: string;
  label: string;
  price: number;
  days_min: number;
  days_max: number;
};

function cleanCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: "Resposta inválida do servidor", raw: text };
  }
}

function calcItemsTotal(items: CartItem[]) {
  return items.reduce((acc, item) => {
    return acc + Number(item.meters || 0) * Number(item.price_per_meter || 0);
  }, 0);
}

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
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
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [shippingPrice, setShippingPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCopyPaste, setQrCopyPaste] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    setItems(getCart());
  }, [orderId]);

  const itemsTotal = useMemo(() => calcItemsTotal(items), [items]);

  const total = useMemo(() => {
    return itemsTotal + Number(shippingPrice || 0);
  }, [itemsTotal, shippingPrice]);

  const selectedShippingOption = useMemo(() => {
    return shippingOptions.find((o) => o.id === selectedShippingId) || null;
  }, [shippingOptions, selectedShippingId]);

  async function quoteShipping(cepValue: string) {
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedShippingId("");
    setShippingPrice(0);

    try {
      const currentItems = getCart();

      const r = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cep: cepValue,
          items: currentItems,
        }),
      });

      const j = await safeJson(r);

      if (!r.ok) {
        throw new Error(j.error || "Erro ao cotar frete");
      }

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
      const currentItems = getCart();

      if (!currentItems.length) {
        alert("Carrinho vazio.");
        return;
      }

      if (!selectedShippingId || !selectedShippingOption) {
        alert("Selecione uma opção de frete.");
        return;
      }

      if (!total || total <= 0) {
        alert("Total inválido. Verifique carrinho e frete.");
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name,
            email,
            phone,
          },
          items: currentItems,
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
          shipping_method: selectedShippingOption.label,
          melhor_envio_service_id: selectedShippingOption.id,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar pedido");
      }

      const createdOrderId = data.orderId as string;

      if (!createdOrderId) {
        throw new Error("API /api/orders não retornou orderId");
      }

      setOrderId(createdOrderId);

      const [first, ...rest] = name.trim().split(/\s+/);

      const payer = {
        email,
        first_name: first || name,
        last_name: rest.join(" ") || "Cliente",
      };

      const pixRes = await fetch("/api/mercadopago/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      clearCart();
    } catch (e: any) {
      alert(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orderId) return;

    const timer = setInterval(async () => {
      const r = await fetch(`/api/order-status?orderId=${orderId}`);
      const j = await r.json();

      if (r.ok) {
        setStatus(j.status);

        if (j.status === "paid") {
          clearInterval(timer);
        }
      }
    }, 3000);

    return () => clearInterval(timer);
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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-2 text-slate-600">
          Preencha seus dados e endereço para finalizar e gerar o Pix.
        </p>

        {!orderId ? (
          <div className="mt-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome completo
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">E-mail</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  WhatsApp
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <p className="mt-1 text-sm text-slate-600">
                Digite o CEP para cotar frete e preencher o endereço.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">CEP</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="00000000"
                    value={cep}
                    onChange={(e) => setCep(cleanCep(e.target.value))}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">UF</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="SP"
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Rua</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Rua..."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Número
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Complemento (opcional)
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Apto, bloco..."
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Bairro
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Bairro..."
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cidade
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Cidade..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold">Frete</h3>

                {shippingLoading ? (
                  <p className="mt-3 text-sm text-slate-500">Cotando…</p>
                ) : null}

                {shippingError ? (
                  <p className="mt-3 text-sm text-red-600">
                    {shippingError}
                  </p>
                ) : null}

                {shippingOptions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Informe um CEP válido para ver opções.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingId === opt.id}
                          onChange={() => onSelectShipping(opt.id)}
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {opt.label}
                          </p>
                          <p className="text-sm text-slate-600">
                            R$ {Number(opt.price).toFixed(2)} • {opt.days_min}-
                            {opt.days_max} dias
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={handleCheckout}
              className="btn-primary w-full px-5 py-3 disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Finalizar e gerar Pix"}
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-sm text-slate-500">Pedido: {orderId}</p>

            {status === "paid" ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h2 className="text-xl font-semibold text-emerald-700">
                  ✅ Pagamento confirmado
                </h2>
                <p className="mt-2 text-sm text-emerald-700">
                  Enviamos um e-mail confirmando a sua compra.
                </p>
                <p className="text-sm text-emerald-700">
                  Todas as atualizações do pedido chegarão por e-mail.
                </p>
                <p className="text-sm text-emerald-700">
                  Se não encontrar, verifique a caixa de spam.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <h2 className="text-xl font-semibold">Aguardando pagamento…</h2>
                <p className="mt-2 text-sm text-slate-500">{status}</p>

                {qrBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="QR Code Pix"
                    className="mt-4 h-56 w-56 rounded-xl border border-slate-200"
                  />
                ) : null}

                {qrCopyPaste ? (
                  <>
                    <button
                      type="button"
                      className="mt-4 btn-outline px-4 py-2"
                      onClick={copyPix}
                    >
                      Copiar Pix
                    </button>

                    <textarea
                      readOnly
                      value={qrCopyPaste}
                      className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="card h-fit p-6">
        <h2 className="text-xl font-semibold">Resumo</h2>
        <p className="mt-1 text-sm text-slate-500">Revise antes de pagar.</p>

        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <p className="font-medium text-slate-900">{item.name}</p>

              {item.color_name ? (
                <p className="mt-1 text-sm text-slate-600">
                  Cor: {item.color_name}
                </p>
              ) : null}

              <p className="mt-1 text-sm text-slate-600">
                {item.meters.toFixed(1)} m × {formatBRL(item.price_per_meter)}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatBRL(item.meters * item.price_per_meter)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal (itens)</span>
            <strong>{formatBRL(itemsTotal)}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span>Frete</span>
            <strong>{formatBRL(shippingPrice)}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span>Método</span>
            <strong>{selectedShippingOption?.label || "-"}</strong>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-lg font-semibold">Total</span>
          <strong className="text-2xl">{formatBRL(total)}</strong>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Após o pagamento, você receberá as atualizações do pedido por e-mail.
        </p>
      </aside>
    </div>
  );
}