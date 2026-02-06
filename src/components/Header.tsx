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

    // Atualiza quando o carrinho mudar (product -> carrinho, carrinho -> checkout etc)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) readCount();
    };
    window.addEventListener("storage", onStorage);

    // Atualiza também quando a aba volta ao foco
    const onFocus = () => readCount();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-white">
          RAMOS TECIDOS
        </Link>

        <nav className="flex items-center gap-2 text-sm text-white/80">
          <Link
            className="rounded-xl px-3 py-2 hover:bg-white/5 hover:text-white transition"
            href="/produtos"
          >
            Produtos
          </Link>

          <Link
            className="rounded-xl px-3 py-2 hover:bg-white/5 hover:text-white transition"
            href="/carrinho"
          >
            <span className="inline-flex items-center gap-2">
              Carrinho
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                <span>Pix</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-white">
                  {count}
                </span>
              </span>
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
