import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CART_KEY = "ramos_cart_v1";

type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_per_meter: number;
  meters: number;
  image?: string;
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
    return items.reduce((acc, i) => acc + (i.meters || 0) * (i.price_per_meter || 0), 0);
  }, [items]);

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Carrinho</h1>
          <p className="mt-1 text-slate-600">
            Ajuste a metragem (múltiplos de 0,5m) e finalize no Pix.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/produtos" className="btn-outline px-4 py-2 text-sm">
            Continuar comprando
          </Link>

          <button onClick={clearCart} disabled={!items.length} className="btn-outline px-4 py-2 text-sm disabled:opacity-50">
            Limpar
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Itens */}
        <div className="lg:col-span-8 space-y-4">
          {!items.length ? (
            <div className="card p-6">
              <p className="text-slate-600">Seu carrinho está vazio.</p>
              <Link href="/produtos" className="btn-primary mt-4 inline-flex px-5 py-3 text-sm">
                Ver produtos
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const sub = (item.meters || 0) * (item.price_per_meter || 0);

              return (
                <div key={item.slug} className="card p-4 hover:shadow-md transition">
                  <div className="flex gap-4">
                    {/* “Foto” / placeholder */}
                    <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">Sem imagem</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/produto/${item.slug}`} className="font-semibold text-slate-900 hover:underline">
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatBRL(item.price_per_meter)} <span className="text-slate-400">/ metro</span>
                          </p>
                        </div>

                        <button onClick={() => removeItem(item.slug)} className="text-sm text-slate-500 hover:text-slate-900 transition">
                          Remover
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        {/* Controle de metros */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dec(item.slug)}
                            className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                            aria-label="Diminuir metragem"
                          >
                            -
                          </button>

                          <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm">
                            <span className="font-semibold text-slate-900">
                              {String(item.meters ?? 0.5).replace(".", ",")}m
                            </span>
                            <span className="ml-2 text-slate-500">(0,5m)</span>
                          </div>

                          <button
                            onClick={() => inc(item.slug)}
                            className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                            aria-label="Aumentar metragem"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Subtotal</p>
                          <p className="text-lg font-semibold text-slate-900">{formatBRL(sub)}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
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
        <aside className="lg:col-span-4">
          <div className="card p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Resumo do pedido</h2>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>Itens</span>
              <span className="font-medium text-slate-900">{items.length}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>Total</span>
              <span className="text-slate-900 font-semibold">{formatBRL(total)}</span>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Você paga via Pix e a confirmação é automática.
            </div>

            <div className="mt-6">
              <Link
                href="/checkout"
                className={`w-full ${items.length ? "btn-primary" : "btn-primary pointer-events-none opacity-50"}`}
              >
                Ir para checkout
              </Link>

              <p className="mt-3 text-xs text-slate-500">
                Frete será calculado no checkout pelo CEP.
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                ✅ Múltiplos de 0,5m
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                ✅ Compra rápida e segura
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
