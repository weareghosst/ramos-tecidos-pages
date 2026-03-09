import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCart,
  removeCartItem,
  updateCartItemMeters,
} from "../lib/cart";
import { CartItem } from "../types/catalog";

export default function CarrinhoPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = () => {
    setItems(getCart());
  };

  useEffect(() => {
    loadCart();

    const handler = () => loadCart();
    window.addEventListener("cart-updated", handler);

    return () => {
      window.removeEventListener("cart-updated", handler);
    };
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.price_per_meter * item.meters;
    }, 0);
  }, [items]);

  const changeMeters = (id: string, current: number, direction: "up" | "down") => {
    const next =
      direction === "up"
        ? Number((current + 0.5).toFixed(2))
        : Number((current - 0.5).toFixed(2));

    if (next < 0.5) return;
    updateCartItemMeters(id, next);
    loadCart();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carrinho</h1>
        <p className="mt-2 text-slate-600">Confira seus produtos antes do checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-6">
          <p className="text-slate-600">Seu carrinho está vazio.</p>
          <Link href="/produtos" className="mt-4 inline-flex btn-primary px-4 py-2">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>

                    {item.color_name ? (
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                        <span
                          className="h-4 w-4 rounded-full border border-slate-300"
                          style={{
                            backgroundColor: item.color_hex || "#e2e8f0",
                          }}
                        />
                        <span>Cor: {item.color_name}</span>
                      </div>
                    ) : null}

                    <p className="mt-1 text-sm text-slate-500">
                      R$ {item.price_per_meter.toFixed(2)} / metro
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => changeMeters(item.id, item.meters, "down")}
                        className="rounded-lg border border-slate-200 px-3 py-1"
                      >
                        -
                      </button>

                      <span className="min-w-[80px] text-center">
                        {item.meters.toFixed(1)} m
                      </span>

                      <button
                        type="button"
                        onClick={() => changeMeters(item.id, item.meters, "up")}
                        className="rounded-lg border border-slate-200 px-3 py-1"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <p className="font-semibold">
                      R$ {(item.price_per_meter * item.meters).toFixed(2)}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        removeCartItem(item.id);
                        loadCart();
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card h-fit p-5">
            <p className="text-lg font-semibold">Resumo do pedido</p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <strong>R$ {total.toFixed(2)}</strong>
            </div>

            <Link
              href="/checkout"
              className="mt-6 inline-flex w-full justify-center btn-primary px-5 py-3"
            >
              Ir para checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}