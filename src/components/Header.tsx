import Link from "next/link";
import { useEffect, useState } from "react";

const CART_KEY = "ramos_cart_v1";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCount() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        const items = raw ? JSON.parse(raw) : [];
        setCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setCount(0);
      }
    }

    readCount();

    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) readCount();
    };
    window.addEventListener("storage", onStorage);

    const onFocus = () => readCount();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="text-sm font-bold tracking-widest text-slate-900">
          RAMOS TECIDOS
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Link
            href="/produtos"
            className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Produtos
          </Link>

          <Link
            href="/carrinho"
            className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-2"
          >
            Carrinho
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
              <span className="font-semibold">{count}</span>
            </span>
          </Link>

          <Link
            href="/checkout"
            className="btn-primary px-3 py-1.5 text-sm"
          >
            Finalizar
          </Link>
        </nav>
      </div>
    </header>
  );
}
