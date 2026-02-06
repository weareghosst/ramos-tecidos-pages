import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0 }}>RAMOS TECIDOS</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/produtos">Produtos</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>
      </header>

      <section style={{ marginTop: 32, padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Tecidos por metro, com qualidade.</h2>
        <p>Escolha seus tecidos favoritos e compre em múltiplos de 0,5m.</p>
        <Link href="/produtos">Ver catálogo →</Link>
      </section>

      <footer style={{ marginTop: 48, fontSize: 14, color: "#666" }}>
        © {new Date().getFullYear()} Ramos Tecidos
      </footer>
    </main>
  );
}
