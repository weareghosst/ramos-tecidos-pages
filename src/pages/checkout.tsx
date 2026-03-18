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

function cleanCep(v: string) { return v.replace(/\D/g, "").slice(0, 8); }
function cleanDocument(v: string) { return v.replace(/\D/g, "").slice(0, 14); }
function formatDocument(v: string) {
  const d = cleanDocument(v);
  if (d.length <= 11) return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}
function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
async function safeJson(res: Response) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { error: "Resposta inválida", raw: text }; }
}
function calcItemsTotal(items: CartItem[]) {
  return items.reduce((acc, item) => acc + Number(item.meters || 0) * Number(item.price_per_meter || 0), 0);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

.rt-co { background: #faf8f5; min-height: 100vh; font-family: 'DM Sans', sans-serif; padding: 3rem 0; }
.rt-title { font-family: 'Cormorant Garamond', serif; font-weight: 400; color: #1a1510; }
.rt-label-tag { display:inline-flex;align-items:center;gap:12px;font-size:11px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;margin-bottom:0.5rem; }
.rt-label-tag::after { content:'';display:block;width:32px;height:1px;background:#c9a96e; }
.rt-card { background: white; border: 1px solid #e8e2d9; border-radius: 4px; }
.rt-section { border-top: 1px solid #f0ece6; padding-top: 1.5rem; margin-top: 1.5rem; }
.rt-field label { display:block;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#9a8f82;margin-bottom:6px; }
.rt-input {
  width:100%;border:1px solid #e8e2d9;border-radius:4px;padding:11px 14px;
  font-family:'DM Sans',sans-serif;font-size:14px;color:#1a1510;
  background:white;outline:none;transition:border-color 0.2s;
}
.rt-input:focus { border-color: #c9a96e; }
.rt-input::placeholder { color: #9a8f82; }
.rt-shipping-opt {
  display:flex;align-items:flex-start;gap:12px;padding:14px 16px;
  border:1px solid #e8e2d9;border-radius:4px;cursor:pointer;transition:all 0.2s;
}
.rt-shipping-opt:hover { border-color: #c9a96e; }
.rt-shipping-opt.selected { border-color: #c9a96e; background: #fdf9f4; }
.rt-shipping-opt input[type=radio] { margin-top: 2px; accent-color: #c9a96e; }
.rt-btn {
  width:100%;padding:14px;background:#1a1510;color:#faf8f5;
  font-size:12px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;
  border:none;border-radius:2px;cursor:pointer;transition:background 0.2s;
}
.rt-btn:hover:not(:disabled) { background: #c9a96e; }
.rt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rt-copy-btn {
  display:inline-flex;align-items:center;padding:10px 20px;
  border:1px solid #e8e2d9;border-radius:2px;font-size:12px;font-weight:500;
  letter-spacing:0.1em;text-transform:uppercase;color:#3d3228;
  background:white;cursor:pointer;transition:all 0.2s;
}
.rt-copy-btn:hover { border-color:#c9a96e;color:#c9a96e; }
.rt-divider { height:1px;background:#f0ece6;margin:12px 0; }
.rt-grid { display:grid;grid-template-columns:1fr 340px;gap:2rem;align-items:start; }
@media(max-width:900px){ .rt-grid { grid-template-columns:1fr; } }
`;

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
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
  const [copied, setCopied] = useState(false);

  useEffect(() => { setItems(getCart()); }, [orderId]);

  const itemsTotal = useMemo(() => calcItemsTotal(items), [items]);
  const total = useMemo(() => itemsTotal + Number(shippingPrice || 0), [itemsTotal, shippingPrice]);
  const selectedShippingOption = useMemo(() => shippingOptions.find((o) => o.id === selectedShippingId) || null, [shippingOptions, selectedShippingId]);

  async function quoteShipping(cepValue: string) {
    setShippingLoading(true); setShippingError(null); setShippingOptions([]); setSelectedShippingId(""); setShippingPrice(0);
    try {
      const r = await fetch("/api/shipping/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cep: cepValue, items: getCart() }) });
      const j = await safeJson(r);
      if (!r.ok) throw new Error(j.error || "Erro ao cotar frete");
      setStreet(j?.address?.street || ""); setDistrict(j?.address?.district || ""); setCity(j?.address?.city || ""); setStateUf(j?.address?.state || "");
      const opts: ShippingOption[] = j?.options || [];
      setShippingOptions(opts);
      if (opts.length) { setSelectedShippingId(opts[0].id); setShippingPrice(Number(opts[0].price || 0)); }
    } catch (e: any) { setShippingError(e?.message || "Erro ao cotar frete"); } finally { setShippingLoading(false); }
  }

  useEffect(() => {
    const c = cleanCep(cep);
    if (c.length === 8) quoteShipping(c);
    else { setShippingError(null); setShippingOptions([]); setSelectedShippingId(""); setShippingPrice(0); }
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
      if (!currentItems.length) { alert("Carrinho vazio."); return; }
      if (!selectedShippingId || !selectedShippingOption) { alert("Selecione uma opção de frete."); return; }
      if (!total || total <= 0) { alert("Total inválido."); return; }
      const cleanDoc = cleanDocument(document);
      if (cleanDoc.length !== 11 && cleanDoc.length !== 14) { alert("Informe um CPF ou CNPJ válido."); return; }

      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { name, email, phone }, items: currentItems, shipping_address: { cep: cleanCep(cep), street, number, complement: complement || null, district, city, state: stateUf, document: cleanDoc }, shipping_price: shippingPrice, shipping_method: selectedShippingOption.label, melhor_envio_service_id: selectedShippingOption.id }) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");
      const createdOrderId = data.orderId as string;
      if (!createdOrderId) throw new Error("API não retornou orderId");
      setOrderId(createdOrderId);

      const [first, ...rest] = name.trim().split(/\s+/);
      const pixRes = await fetch("/api/mercadopago/create-pix", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: createdOrderId, amount: total, payer: { email, first_name: first || name, last_name: rest.join(" ") || "Cliente" } }) });
      const pix = await safeJson(pixRes);
      if (!pixRes.ok) throw new Error(pix?.mp_message || pix?.error || "Erro ao gerar Pix");
      setQrBase64(pix.qr_code_base64 || null); setQrCopyPaste(pix.qr_code || null); setStatus(pix.status || "pending");
      clearCart();
    } catch (e: any) { alert(e?.message || "Erro"); } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!orderId) return;
    const timer = setInterval(async () => {
      const r = await fetch(`/api/order-status?orderId=${orderId}`);
      const j = await r.json();
      if (r.ok) { setStatus(j.status); if (j.status === "paid") clearInterval(timer); }
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId]);

  async function copyPix() {
    if (!qrCopyPaste) return;
    await navigator.clipboard.writeText(qrCopyPaste);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const disabled = !name || !email || !phone || (cleanDocument(document).length !== 11 && cleanDocument(document).length !== 14) || cleanCep(cep).length !== 8 || !street || !number || !district || !city || !stateUf || !selectedShippingId || loading;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="rt-field"><label>{label}</label>{children}</div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="rt-co">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>

          <div style={{ marginBottom: "2.5rem" }}>
            <div className="rt-label-tag">Finalizar compra</div>
            <h1 className="rt-title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>Checkout</h1>
            <p style={{ color: "#9a8f82", fontSize: "14px", marginTop: 4 }}>Preencha seus dados e endereço para gerar o Pix.</p>
          </div>

          <div className="rt-grid">

            {/* FORMULÁRIO */}
            <div className="rt-card" style={{ padding: "2rem" }}>
              {!orderId ? (
                <>
                  {/* DADOS PESSOAIS */}
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#1a1510", marginBottom: "1.25rem" }}>
                    Dados pessoais
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <Field label="Nome completo"><input className="rt-input" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    <Field label="E-mail"><input className="rt-input" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                    <Field label="WhatsApp"><input className="rt-input" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                    <Field label="CPF ou CNPJ"><input className="rt-input" placeholder="000.000.000-00" value={formatDocument(document)} onChange={(e) => setDocument(e.target.value)} /></Field>
                  </div>

                  {/* ENDEREÇO */}
                  <div className="rt-section">
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#1a1510", marginBottom: "4px" }}>Endereço de entrega</h2>
                    <p style={{ fontSize: "13px", color: "#9a8f82", marginBottom: "1.25rem" }}>Digite o CEP para cotar o frete e preencher automaticamente.</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="CEP"><input className="rt-input" placeholder="00000-000" value={cep} onChange={(e) => setCep(cleanCep(e.target.value))} /></Field>
                      <Field label="UF"><input className="rt-input" placeholder="SP" value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase())} /></Field>
                      <div style={{ gridColumn: "span 2" }}>
                        <Field label="Rua"><input className="rt-input" placeholder="Rua..." value={street} onChange={(e) => setStreet(e.target.value)} /></Field>
                      </div>
                      <Field label="Número"><input className="rt-input" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} /></Field>
                      <Field label="Complemento (opcional)"><input className="rt-input" placeholder="Apto, bloco..." value={complement} onChange={(e) => setComplement(e.target.value)} /></Field>
                      <Field label="Bairro"><input className="rt-input" placeholder="Bairro..." value={district} onChange={(e) => setDistrict(e.target.value)} /></Field>
                      <Field label="Cidade"><input className="rt-input" placeholder="Cidade..." value={city} onChange={(e) => setCity(e.target.value)} /></Field>
                    </div>
                  </div>

                  {/* FRETE */}
                  <div className="rt-section">
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#1a1510", marginBottom: "1rem" }}>Opções de frete</h2>

                    {shippingLoading && <p style={{ color: "#9a8f82", fontSize: 14 }}>Cotando fretes...</p>}
                    {shippingError && <p style={{ color: "#c0392b", fontSize: 14 }}>{shippingError}</p>}
                    {!shippingLoading && !shippingError && shippingOptions.length === 0 && (
                      <p style={{ color: "#9a8f82", fontSize: 14 }}>Informe um CEP válido para ver as opções.</p>
                    )}
                    {shippingOptions.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {shippingOptions.map((opt) => (
                          <label key={opt.id} className={`rt-shipping-opt${selectedShippingId === opt.id ? " selected" : ""}`} onClick={() => onSelectShipping(opt.id)}>
                            <input type="radio" name="shipping" checked={selectedShippingId === opt.id} onChange={() => onSelectShipping(opt.id)} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 500, color: "#1a1510", fontSize: 14 }}>{opt.label}</p>
                              <p style={{ fontSize: 13, color: "#9a8f82", marginTop: 2 }}>
                                {formatBRL(opt.price)} · {opt.days_min}–{opt.days_max} dias úteis
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "2rem" }}>
                    <button type="button" disabled={disabled} onClick={handleCheckout} className="rt-btn">
                      {loading ? "Gerando Pix..." : "Finalizar e gerar Pix"}
                    </button>
                  </div>
                </>
              ) : (
                // PIX GERADO
                <div>
                  <p style={{ fontSize: 12, color: "#9a8f82", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>
                    Pedido: <span style={{ fontFamily: "monospace" }}>{orderId}</span>
                  </p>

                  {status === "paid" ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1.5rem" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 400, color: "#166534", marginBottom: 8 }}>
                        Pagamento confirmado ✓
                      </div>
                      <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
                        Enviamos um e-mail com a confirmação da sua compra.<br />
                        Você receberá o código de rastreio quando o pedido for enviado.
                      </p>
                      <Link href="/produtos" style={{ display: "inline-flex", marginTop: "1.25rem", padding: "10px 24px", background: "#1a1510", color: "#faf8f5", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", borderRadius: 2 }}>
                        Continuar comprando
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 400, color: "#1a1510", marginBottom: 8 }}>
                        Aguardando pagamento
                      </h2>
                      <p style={{ fontSize: 13, color: "#9a8f82", marginBottom: "1.5rem" }}>
                        Escaneie o QR Code ou copie o código Pix abaixo.
                      </p>

                      {qrBase64 && (
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                          <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code Pix" style={{ width: 200, height: 200, border: "1px solid #e8e2d9", borderRadius: 4, padding: 8 }} />
                        </div>
                      )}

                      {qrCopyPaste && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button type="button" onClick={copyPix} className="rt-copy-btn">
                            {copied ? "✓ Copiado!" : "Copiar código Pix"}
                          </button>
                          <textarea readOnly value={qrCopyPaste} style={{ minHeight: 100, width: "100%", border: "1px solid #e8e2d9", borderRadius: 4, padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "#9a8f82", resize: "none", background: "#faf8f5", outline: "none" }} />
                        </div>
                      )}

                      <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9a8f82" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a96e", animation: "pulse 1.5s infinite", display: "inline-block" }} />
                        Verificando pagamento automaticamente...
                      </div>
                      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RESUMO */}
            <aside className="rt-card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#1a1510", marginBottom: "1rem" }}>
                Resumo
              </h2>

              {items.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9a8f82" }}>Carrinho vazio.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.25rem" }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ paddingBottom: 10, borderBottom: "1px solid #f0ece6" }}>
                      <p style={{ fontWeight: 500, color: "#1a1510", fontSize: 14 }}>{item.name}</p>
                      {item.color_name && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color_hex || "#e2e8f0", border: "1px solid #e8e2d9", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#9a8f82" }}>{item.color_name}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: "#9a8f82", marginTop: 3 }}>
                        {item.meters.toFixed(1)} m × {formatBRL(item.price_per_meter)}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1510", marginTop: 3 }}>
                        {formatBRL(item.meters * item.price_per_meter)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#9a8f82" }}>
                  <span>Subtotal</span><span>{formatBRL(itemsTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#9a8f82" }}>
                  <span>Frete</span><span>{shippingPrice > 0 ? formatBRL(shippingPrice) : "—"}</span>
                </div>
                {selectedShippingOption && (
                  <div style={{ fontSize: 11, color: "#c9a96e", letterSpacing: "0.05em" }}>{selectedShippingOption.label}</div>
                )}
              </div>

              <div className="rt-divider" style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, color: "#1a1510" }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", fontWeight: 400, color: "#1a1510" }}>
                  {formatBRL(total)}
                </span>
              </div>

              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 5 }}>
                {["Pagamento via Pix", "Confirmação automática", "Rastreio por e-mail"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9a8f82" }}>
                    <span style={{ color: "#c9a96e" }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
