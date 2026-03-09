import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartMeters,
} from "@/lib/cart";
import type { CartItem } from "@/types/catalog";

function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Carrinho() {
  const [items, setItems] = useState<CartItem[]>([]);

  function loadCart() {
    setItems(getCart());
  }

  useEffect(() => {
    loadCart();

    const handler = () => loadCart();
    window.addEventListener("cart-updated", handler);

    return () => {
      window.removeEventListener("cart-updated", handler);
    };
  }, []);

  function clearAll() {
    clearCart();
    loadCart();
  }

  function removeItem(id: string) {
    removeFromCart(id);
    loadCart();
  }

  function setMeters(id: string, meters: number) {
    updateCartMeters(id, meters);
    loadCart();
  }

  function inc(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setMeters(id, item.meters + 0.5);
  }

  function dec(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setMeters(id, Math.max(0.5, item.meters - 0.5));
  }

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + item.meters * item.price_per_meter;
    }, 0);
  }, [items]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carrinho</h1>
        <p className="mt-2 text-slate-600">
          Ajuste a metragem (múltiplos de 0,5m) e finalize no Pix.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/produtos" className="btn-outline px-4 py-2">
          Continuar comprando
        </Link>

        <button type="button" onClick={clearAll} className="btn-outline px-4 py-2">
          Limpar
        </button>
      </div>

      {!items.length ? (
        <div className="card p-6">
          <p className="text-slate-600">Seu carrinho está vazio.</p>
          <Link href="/produtos" className="mt-4 inline-flex btn-primary px-4 py-2">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const subtotal = item.meters * item.price_per_meter;

              return (
                <div key={item.id} className="card p-4">
                  <div className="flex gap-4">
                    <div className="h-24 w-24 overflow-hidden rounded-xl border bg-slate-50">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>

                      {item.color_name ? (
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.color_hex || "#e2e8f0" }}
                          />
                          <span>Cor: {item.color_name}</span>
                        </div>
                      ) : null}

                      <p className="mt-1 text-sm text-slate-500">
                        {formatBRL(item.price_per_meter)} / metro
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="mt-2 text-sm text-slate-500 hover:text-slate-900 transition"
                      >
                        Remover
                      </button>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => dec(item.id)}
                          className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                        >
                          -
                        </button>

                        <div className="min-w-[96px] text-center text-sm font-medium">
                          {item.meters.toFixed(1).replace(".", ",")}m
                        </div>

                        <button
                          type="button"
                          onClick={() => inc(item.id)}
                          className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">Subtotal</p>
                      <p className="font-semibold">{formatBRL(subtotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card h-fit p-6">
            <h2 className="text-xl font-semibold">Resumo do pedido</h2>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Itens</span>
              <strong>{items.length}</strong>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span>Total</span>
              <strong>{formatBRL(total)}</strong>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Você paga via Pix e a confirmação é automática.
            </p>

            <Link
              href="/checkout"
              className="mt-6 inline-flex w-full justify-center btn-primary px-5 py-3"
            >
              Ir para checkout
            </Link>

            <div className="mt-4 space-y-1 text-sm text-slate-500">
              <p>Frete será calculado no checkout pelo CEP.</p>
              <p>✅ Múltiplos de 0,5m</p>
              <p>✅ Compra rápida e segura</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}