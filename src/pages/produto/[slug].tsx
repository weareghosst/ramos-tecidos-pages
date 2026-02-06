import { useRouter } from "next/router";
import Link from "next/link";
import { useMemo, useState } from "react";

function isValidMeters(m: number) {
  return m >= 0.5 && Number.isInteger(m * 2);
}

export default function Produto() {
  const router = useRouter();
  const slug = String(router.query.slug || "");

  // Mock: depois vamos puxar do Supabase
  const product = useMemo(() => {
    const map: any = {
      "tricoline-floral-azul": { id: "p1", name: "Tricoline Floral Azul", pricePerMeter: 24.9 },
      "linho-natural": { id: "p2", name: "Linho Natural", pricePerMeter: 49.9 },
    };
    return map[slug];
  }, [slug]);

  const [meters, setMeters] = useState<number>(0.5);

  if (!product) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Link href="/produtos">← Voltar</Link>
        <h1>Produto não encontrado</h1>
      </main>
    );
  }

  function addToCart() {
    if (!isValidMeters(meters)) {
      alert("Quantidade inválida. Use múltiplos de 0,5m.");
      return;
    }
    const cartKey = "ramos_cart_v1";
    const current = JSON.parse(localStorage.getItem(cartKey) || "[]");
    current.push({
      productId: product.id,
      name: product.name,
      pricePerMeter: product.pricePerMeter,
      meters,
    });
    localStorage.setItem(cartKey, JSON.stringify(current));
    router.push("/carrinho");
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/produtos">← Produtos</Link>
        <Link href="/carrinho">Carrinho</Link>
      </header>

      <h1 style={{ marginTop: 16 }}>{product.name}</h1>
      <p>R$ {product.pricePerMeter.toFixed(2)} / metro</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <label>Quantidade (m):</label>
        <input
          type="number"
          step={0.5}
          min={0.5}
          value={meters}
          onChange={(e) => setMeters(Number(e.target.value))}
          style={{ width: 100, padding: 8 }}
        />
        <button onClick={addToCart} style={{ padding: "10px 14px" }}>
          Adicionar ao carrinho
        </button>
      </div>
    </main>
  );
}
