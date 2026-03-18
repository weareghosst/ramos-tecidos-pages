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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function readCount() {
      try {
        const items = getCart();
        setCount(Array.isArray(items) ? items.length : 0);
      } catch { setCount(0); }
    }
    readCount();
    window.addEventListener("storage", readCount);
    window.addEventListener("focus", readCount);
    window.addEventListener("cart-updated", readCount);
    return () => {
      window.removeEventListener("storage", readCount);
      window.removeEventListener("focus", readCount);
      window.removeEventListener("cart-updated", readCount);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .rt-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(250, 248, 245, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e8e2d9;
          transition: box-shadow 0.3s;
          font-family: 'DM Sans', sans-serif;
        }
        .rt-header.scrolled {
          box-shadow: 0 4px 24px rgba(26, 21, 16, 0.06);
        }
        .rt-header-top {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .rt-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .rt-logo img {
          height: 48px;
          width: auto;
          object-fit: contain;
        }
        .rt-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rt-nav-link {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3d3228;
          text-decoration: none;
          padding: 8px 16px;
          transition: color 0.2s;
        }
        .rt-nav-link:hover { color: #c9a96e; }
        .rt-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e8e2d9;
          border-radius: 2px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3d3228;
          text-decoration: none;
          transition: all 0.2s;
        }
        .rt-cart-btn:hover { border-color: #c9a96e; color: #c9a96e; }
        .rt-cart-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: #c9a96e;
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 99px;
        }
        .rt-checkout-btn {
          display: inline-flex;
          align-items: center;
          padding: 8px 20px;
          background: #1a1510;
          color: #faf8f5;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: background 0.2s;
        }
        .rt-checkout-btn:hover { background: #c9a96e; }
        .rt-categories {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .rt-cat-pill {
          padding: 5px 14px;
          border: 1px solid #e8e2d9;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 400;
          color: #9a8f82;
          text-decoration: none;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .rt-cat-pill:hover { border-color: #c9a96e; color: #c9a96e; background: #fdf9f4; }
      `}</style>

      <header className={`rt-header${scrolled ? " scrolled" : ""}`}>
        <div className="rt-header-top">
          <Link href="/" className="rt-logo">
            <img src="/logo-ramos.png" alt="Ramos Tecidos" />
          </Link>

          <nav className="rt-nav">
            <Link href="/produtos" className="rt-nav-link">Produtos</Link>
            <Link href="/carrinho" className="rt-cart-btn">
              Carrinho
              <span className="rt-cart-badge">{count}</span>
            </Link>
            <Link href="/checkout" className="rt-checkout-btn">Finalizar</Link>
          </nav>
        </div>

        <div className="rt-categories">
          {QUICK_TYPES.map((item) => (
            <Link key={item.label} href={item.href} className="rt-cat-pill">
              {item.label}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}
