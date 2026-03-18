import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearCart, getCart, removeFromCart, updateCartMeters } from "@/lib/cart";
import type { CartItem } from "@/types/catalog";

function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
.rt-page { background: #faf8f5; min-height: 100vh; font-family: 'DM Sans', sans-serif; padding: 3rem 0; }
.rt-title { font-family: 'Cormorant Garamond', serif; font-weight: 400; color: #1a1510; }
.rt-label { display:inline-flex;align-items:center;gap:12px;font-size:11px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#c9a96e;margin-bottom:0.5rem; }
.rt-label::after { content:'';display:block;width:32px;height:1px;background:#c9a96e; }
.rt-card { background: white; border: 1px solid #e8e2d9; border-radius: 4px; }
.rt-item { padding: 20px; border-bottom: 1px solid #f0ece6; }
.rt-item:last-child { border-bottom: none; }
.rt-qty-btn {
  width: 32px; height: 32px; border: 1px solid #e8e2d9; border-radius: 2px;
  background: white; font-size: 16px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; color: #3d3228;
}
.rt-qty-btn:hover { border-color: #c9a96e; color: #c9a96e; }
.rt-remove { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a8f82; background: none; border: none; cursor: pointer; padding: 0; transition: color 0.2s; }
.rt-remove:hover { color: #c9a96e; }
.rt-btn-primary { display:inline-flex;align-items:center;justify-content:center;padding:13px 28px;background:#1a1510;color:#faf8f5;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;border:none;border-radius:2px;cursor:pointer;text-decoration:none;transition:background 0.2s;width:100%; }
.rt-btn-primary:hover { background: #c9a96e; }
.rt-btn-outline { display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;background:transparent;color:#3d3228;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;border:1px solid #e8e2d9;border-radius:2px;cursor:pointer;text-decoration:none;transition:all 0.2s; }
.rt-btn-outline:hover { border-color:#c9a96e;color:#c9a96e; }
.rt-divider { height: 1px; background: #f0ece6; margin: 12px 0; }
`;

export default function Carrinho() {
  const [items, setItems] = useState<CartItem[]>([]);

  function loadCart() { setItems(getCart()); }

  useEffect(() => {
    loadCart();
    const h = () => loadCart();
    window.addEventListener("cart-updated", h);
    return () => window.removeEventListener("cart-updated", h);
  }, []);

  function clearAll() { clearCart(); loadCart(); }
  function removeItem(id: string) { removeFromCart(id); loadCart(); }
  function setMeters(id: string, m: number) { updateCartMeters(id, m); loadCart(); }
  function inc(id: string) { const i = items.find((x) => x.id === id); if (i) setMeters(id, i.meters + 0.5); }
  function dec(id: string) { const i = items.find((x) => x.id === id); if (i) setMeters(id, Math.max(0.5, i.meters - 0.5)); }

  const total = useMemo(() => items.reduce((a, i) => a + i.meters * i.price_per_meter, 0), [items]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="rt-page">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>

          <div style={{ marginBottom: "2.5rem" }}>
            <div className="rt-label">Seu pedido</div>
            <h1 className="rt-title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>Carrinho</h1>
            <p style={{ color: "#9a8f82", fontSize: "14px", marginTop: "4px" }}>
              Ajuste a metragem (múltiplos de 0,5m) e finalize no Pix.
            </p>
          </div>

          {!items.length ? (
            <div className="rt-card" style={{ padding: "4rem", textAlign: "center" }}>
              <p style={{ color: "#9a8f82", marginBottom: "1.5rem", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem" }}>
                Seu carrinho está vazio
              </p>
              <Link href="/produtos" className="rt-btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                Ver produtos
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>

              {/* ITENS */}
              <div className="rt-card">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0ece6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#9a8f82" }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  <button type="button" onClick={clearAll} className="rt-remove">Limpar carrinho</button>
                </div>

                {items.map((item) => {
                  const subtotal = item.meters * item.price_per_meter;
                  return (
                    <div key={item.id} className="rt-item">
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ width: 88, height: 88, borderRadius: 4, overflow: "hidden", border: "1px solid #e8e2d9", flexShrink: 0 }}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#9a8f82" }}>Sem imagem</div>
                          }
                        </div>

                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 500, color: "#1a1510", marginBottom: 4 }}>{item.name}</p>
                          {item.color_name && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color_hex || "#e2e8f0", border: "1px solid #e8e2d9", flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: "#9a8f82" }}>{item.color_name}</span>
                            </div>
                          )}
                          <p style={{ fontSize: 13, color: "#9a8f82" }}>{formatBRL(item.price_per_meter)} / metro</p>

                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                            <button type="button" onClick={() => dec(item.id)} className="rt-qty-btn">−</button>
                            <span style={{ fontSize: 14, fontWeight: 500, minWidth: 64, textAlign: "center" }}>
                              {item.meters.toFixed(1).replace(".", ",")} m
                            </span>
                            <button type="button" onClick={() => inc(item.id)} className="rt-qty-btn">+</button>
                            <button type="button" onClick={() => removeItem(item.id)} className="rt-remove" style={{ marginLeft: 8 }}>Remover</button>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 12, color: "#9a8f82", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subtotal</p>
                          <p style={{ fontWeight: 600, color: "#1a1510" }}>{formatBRL(subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ padding: "16px 20px" }}>
                  <Link href="/produtos" className="rt-btn-outline" style={{ width: "auto", display: "inline-flex" }}>
                    Continuar comprando
                  </Link>
                </div>
              </div>

              {/* RESUMO */}
              <div className="rt-card" style={{ padding: "24px" }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#1a1510", marginBottom: "1.25rem" }}>
                  Resumo
                </h2>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8, color: "#9a8f82" }}>
                  <span>Itens</span><span>{items.length}</span>
                </div>
                <div className="rt-divider" />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#1a1510", marginBottom: 8 }}>
                  <span>Total dos produtos</span><span>{formatBRL(total)}</span>
                </div>
                <p style={{ fontSize: 12, color: "#9a8f82", marginBottom: "1.5rem" }}>
                  + frete calculado no checkout
                </p>

                <Link href="/checkout" className="rt-btn-primary">Ir para pagamento</Link>

                <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Pagamento seguro via Pix", "Múltiplos de 0,5m", "Rastreio após envio"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9a8f82" }}>
                      <span style={{ color: "#c9a96e" }}>✓</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
