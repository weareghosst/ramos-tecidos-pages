import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Container from "../components/Container";

const CART_KEY = "ramos_cart_v1";

type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_per_meter: number;
  meters: number;
};

function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Carrinho() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  function save(next: CartItem[]) {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function clearCart() {
    save([]);
  }

  function removeItem(slug: string) {
    save(items.filter((i) => i.slug !== slug));
  }

  function setMeters(slug: string, meters: number) {
    const m = Math.max(0.5, Number(meters.toFixed(2)));
    const next = items.map((i) => (i.slug === slug ? { ...i, meters: m } : i));
    save(next);
  }

  function inc(slug: string) {
    const it = items.find((i) => i.slug === slug);
    if (!it) return;
    setMeters(slug, (it.meters || 0) + 0.5);
  }

  function dec(slug: string) {
    const it = items.find((i) => i.slug === slug);
    if (!it) return;
    setMeters(slug, Math.max(0.5, (it.meters || 0.5) - 0.5));
  }

  const total = useMemo(() => {
    return items.reduce(
      (acc, i) => acc + (i.meters || 0) * (i.price_per_meter || 0),
      0
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-10">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Carrinho</h1>
              <p className="mt-1 text-white/60">
                Ajuste a metragem (múltiplos de 0,5m) e finalize no Pix.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/produtos"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Continuar comprando
              </Link>
              <button
                onClick={clearCart}
                disabled={!items.length}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 transition disabled:opacity-40"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Itens */}
            <div className="md:col-span-2 space-y-4">
              {!items.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-white/70">Seu carrinho está vazio.</p>
                  <Link
                    href="/produtos"
                    className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition"
                  >
                    Ver produtos
                  </Link>
                </div>
              ) : (
                items.map((item) => {
                  const sub = (item.meters || 0) * (item.price_per_meter || 0);

                  return (
                    <div
                      key={item.slug}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 hover:border-white/20"
                    >
                      <div className="flex gap-4">
                        <div className="h-20 w-20 rounded-xl bg-white/10 flex items-center justify-center text-white/40">
                          Foto
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/produto/${item.slug}`}
                                className="font-semibold text-white hover:underline"
                              >
                                {item.name}
                              </Link>
                              <p className="mt-1 text-sm text-white/60">
                                {formatBRL(item.price_per_meter)}{" "}
                                <span className="text-white/50">/ metro</span>
                              </p>
                            </div>

                            <button
                              onClick={() => removeItem(item.slug)}
                              className="text-sm text-white/60 hover:text-white transition"
                            >
                              Remover
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                            {/* Controle de metros */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => dec(item.slug)}
                                className="h-9 w-9 rounded-xl border border-white/15 hover:bg-white/5 transition"
                              >
                                -
                              </button>

                              <div className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm">
                                <span className="font-semibold">
                                  {String(item.meters ?? 0.5).replace(".", ",")}m
                                </span>
                                <span className="ml-2 text-white/60">(0,5m)</span>
                              </div>

                              <button
                                onClick={() => inc(item.slug)}
                                className="h-9 w-9 rounded-xl border border-white/15 hover:bg-white/5 transition"
                              >
                                +
                              </button>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                              <p className="text-xs text-white/60">Subtotal</p>
                              <p className="text-lg font-semibold">
                                {formatBRL(sub)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-xs text-white/60">
                            Pagamento via Pix • Confirmação automática após pagar.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumo */}
            <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 h-fit">
              <h2 className="text-lg font-semibold">Resumo do pedido</h2>

              <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                <span>Itens</span>
                <span>{items.length}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                <span>Total</span>
                <span className="text-white font-semibold">{formatBRL(total)}</span>
              </div>

              <div className="mt-2 text-xs text-white/60">
                Você paga via Pix e a confirmação é automática.
              </div>

              <div className="mt-6">
                <Link
                  href="/checkout"
                  className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                    items.length
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/20 text-white/50 pointer-events-none"
                  }`}
                >
                  Ir para checkout
                </Link>

                <p className="mt-3 text-xs text-white/50">
                  Em breve: frete por CEP. (Semana 2)
                </p>
              </div>

              <div className="mt-6 space-y-2 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  ✅ Múltiplos de 0,5m
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  ✅ Compra rápida e segura
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
