import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useParallax(speed = 0.4) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return offset * speed;
}

export default function Home() {
  const { data } = useSWR("/api/products", fetcher);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const parallaxY = useParallax(0.35);

  const products = data?.products || [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/produtos?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .hero-section {
          position: relative;
          min-height: 70vh;
          overflow: hidden;
          background: #faf8f5;
          font-family: 'DM Sans', sans-serif;
        }

        .parallax-bg {
          position: absolute;
          inset: -20%;
          background-image: url('/banner-tecidos.jpg');
          background-size: cover;
          background-position: center;
          will-change: transform;
          filter: brightness(0.35) saturate(0.8);
        }

        .parallax-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(15, 12, 8, 0.85) 0%,
            rgba(30, 22, 14, 0.6) 50%,
            rgba(15, 12, 8, 0.4) 100%
          );
        }

        .fabric-texture {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.3) 2px,
            rgba(255,255,255,0.3) 3px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.3) 2px,
            rgba(255,255,255,0.3) 3px
          );
        }

        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 70vh;
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-bottom: 1.5rem;
        }

        .hero-tag::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: #c9a96e;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 300;
          line-height: 1.05;
          color: #faf8f5;
          margin-bottom: 1.5rem;
          max-width: 700px;
        }

        .hero-title em {
          font-style: italic;
          color: #c9a96e;
        }

        .hero-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 300;
          color: rgba(250, 248, 245, 0.65);
          max-width: 420px;
          line-height: 1.7;
          margin-bottom: 2.5rem;
          letter-spacing: 0.01em;
        }

        .search-bar {
          display: flex;
          gap: 0;
          max-width: 480px;
          border: 1px solid rgba(201, 169, 110, 0.4);
          border-radius: 4px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(8px);
          margin-bottom: 2rem;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 14px 20px;
          color: #faf8f5;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
        }

        .search-input::placeholder { color: rgba(250,248,245,0.4); }

        .search-btn {
          background: #c9a96e;
          border: none;
          padding: 14px 24px;
          color: #0f0c08;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-btn:hover { background: #b8935a; }

        .hero-ctas {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: #c9a96e;
          color: #0f0c08;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: all 0.2s;
        }

        .cta-primary:hover { background: #b8935a; transform: translateY(-1px); }

        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: transparent;
          color: #faf8f5;
          border: 1px solid rgba(250,248,245,0.3);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: all 0.2s;
        }

        .cta-secondary:hover { border-color: rgba(250,248,245,0.7); transform: translateY(-1px); }

        .hero-scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: rgba(250,248,245,0.4);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          z-index: 10;
          animation: bounce 2s infinite;
        }

        .scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(201,169,110,0.6), transparent);
          animation: extend 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes extend {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-bottom: 1rem;
        }

        .section-label::after {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: #c9a96e;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          color: #1a1510;
          line-height: 1.1;
        }

        .category-card {
          position: relative;
          padding: 28px 24px;
          border: 1px solid #e8e2d9;
          border-radius: 4px;
          background: #faf8f5;
          text-decoration: none;
          transition: all 0.3s;
          overflow: hidden;
        }

        .category-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #c9a96e;
          transition: width 0.3s;
        }

        .category-card:hover { border-color: #c9a96e; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .category-card:hover::before { width: 100%; }

        .category-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1510;
          margin-bottom: 4px;
        }

        .category-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #9a8f82;
        }

        .page-bg {
          background: #faf8f5;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="page-bg">
        {/* HERO PARALLAX */}
        <section className="hero-section">
          <div
            className="parallax-bg"
            style={{ transform: `translateY(${parallaxY}px)` }}
          />
          <div className="parallax-overlay" />
          <div className="fabric-texture" />

          <div className="hero-content">
            <div className="hero-tag">Ramos Tecidos — Qualidade & Tradição</div>

            <h1 className="hero-title">
              Tecidos que<br />
              <em>inspiram</em><br />
              criações
            </h1>

            <p className="hero-subtitle">
              Tricoline lisa, estampada, digital e muito mais.
              Venda por metro com entrega rápida para todo o Brasil.
            </p>

            <form onSubmit={handleSearch} className="search-bar">
              <input
                type="text"
                placeholder="O que você procura?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">Buscar</button>
            </form>

            <div className="hero-ctas">
              <Link href="/produtos" className="cta-primary">Ver tecidos</Link>
              <Link href="/produtos?type=Tricoline%20Estampada" className="cta-secondary">Estampados</Link>
            </div>
          </div>

          <div className="hero-scroll-indicator">
            <div className="scroll-line" />
            <span>scroll</span>
          </div>
        </section>

        {/* CATEGORIAS */}
        <section style={{ padding: "5rem 0", background: "#faf8f5" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
            <div className="section-label">Categorias</div>
            <h2 className="section-title" style={{ marginBottom: "2.5rem" }}>
              Tipos de tecidos
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {[
                { href: "/produtos?type=Tricoline%20Lisa", name: "Tricoline Lisa", desc: "Tecidos básicos" },
                { href: "/produtos?type=Tricoline%20Estampada", name: "Tricoline Estampada", desc: "Estampas variadas" },
                { href: "/produtos?type=Tricoline%20Digital", name: "Tricoline Digital", desc: "Alta definição" },
                { href: "/produtos?type=Malhas", name: "Malhas", desc: "Elasticidade e conforto" },
              ].map((cat) => (
                <Link key={cat.href} href={cat.href} className="category-card">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-desc">{cat.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DIVISOR */}
        <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #e8e2d9 20%, #e8e2d9 80%, transparent)", margin: "0 2rem" }} />

        {/* PRODUTOS EM DESTAQUE */}
        <section style={{ padding: "5rem 0", background: "#faf8f5" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div className="section-label">Destaques</div>
                <h2 className="section-title">Produtos em destaque</h2>
              </div>
              <Link
                href="/produtos"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#c9a96e",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: "1px solid #c9a96e",
                  paddingBottom: "2px",
                }}
              >
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* RODAPÉ DE SEÇÃO */}
        <section style={{
          padding: "5rem 2rem",
          background: "#1a1510",
          textAlign: "center",
        }}>
          <div className="section-label" style={{ justifyContent: "center", color: "#c9a96e" }}>
            Entrega para todo o Brasil
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 300,
            color: "#faf8f5",
            marginBottom: "1.5rem",
          }}>
            Qualidade que você <em style={{ fontStyle: "italic", color: "#c9a96e" }}>sente</em>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "15px",
            color: "rgba(250,248,245,0.5)",
            maxWidth: 480,
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}>
            Tecidos selecionados com cuidado, vendidos por metro,
            com pagamento via Pix e rastreio do pedido.
          </p>
          <Link href="/produtos" className="cta-primary">
            Explorar catálogo
          </Link>
        </section>
      </div>
    </>
  );
}
