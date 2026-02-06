import Link from "next/link";

const MOCK = [
  { slug: "tricoline-floral-azul", name: "Tricoline Floral Azul", pricePerMeter: 24.9 },
  { slug: "linho-natural", name: "Linho Natural", pricePerMeter: 49.9 },
];

export default function Produtos() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Produtos</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/">Home</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>
      </header>

      <ul style={{ marginTop: 24, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
        {MOCK.map((p) => (
          <li key={p.slug} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
            <strong>{p.name}</strong>
            <div style={{ marginTop: 6 }}>R$ {p.pricePerMeter.toFixed(2)} / metro</div>
            <div style={{ marginTop: 10 }}>
              <Link href={`/produto/${p.slug}`}>Ver produto →</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
