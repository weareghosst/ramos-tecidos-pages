import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

const QUICK_TYPES = [
  { label: "Tricoline Lisa", href: "/produtos?type=Tricoline%20Lisa" },
  { label: "Tricoline Estampada", href: "/produtos?type=Tricoline%20Estampada" },
  { label: "Tricoline Digital", href: "/produtos?type=Tricoline%20Digital" },
  { label: "Malhas", href: "/produtos?type=Malhas" },
  { label: "Mantas e Fibras", href: "/produtos?type=Mantas%20e%20Fibras" },
  { label: "Outros", href: "/produtos?type=Outros" },
];

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCount() {
      try {
        const items = getCart();
        setCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setCount(0);
      }
    }

    readCount();

    const onStorage = () => readCount();
    const onFocus = () => readCount();
    const onCartUpdated = () => readCount();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("cart-updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-ramos.png"
              alt="Ramos Tecidos"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/produtos" className="hover:text-slate-700">
              Produtos
            </Link>

            <Link
              href="/carrinho"
              className="btn-outline px-3 py-1.5 rounded-lg inline-flex items-center gap-2"
            >
              <span>Carrinho</span>
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-slate-300 px-1 text-xs">
                {count}
              </span>
            </Link>

            <Link
              href="/checkout"
              className="btn-primary px-3 py-1.5 rounded-lg"
            >
              Finalizar
            </Link>
          </nav>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_TYPES.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}