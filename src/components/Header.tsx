import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

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
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page h-16 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight text-lg">
          RAMOS TECIDOS
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
    </header>
  );
}