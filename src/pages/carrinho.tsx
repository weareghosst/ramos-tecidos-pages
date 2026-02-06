import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Item = { productId: string; name: string; pricePerMeter: number; meters: number };

export default function Carrinho() {
  const [items, setItems] = useState<Item[]>([]);
  const cartKey = "ramos_cart_v1";

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(cartKey) || "[]"));
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, it) => sum + it.pricePerMeter * it.meters, 0);
  }, [items]);

  function clear() {
    localStorage.removeItem(cartKey);
    setItems([]);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Carrinho</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/">Home</Link>
          <Link href="/produtos">Produtos</Link>
        </nav>
      </header>

      {items.length === 0 ? (
        <p style={{ marginTop: 24 }}>
          Seu carrinho está vazio. <Link href="/produtos">Ver produtos</Link>
        </p>
      ) : (
        <>
          <ul style={{ marginTop: 24, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {items.map((it, idx) => (
              <li key={idx} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
                <strong>{it.name}</strong>
                <div>{it.meters} m × R$ {it.pricePerMeter.toFixed(2)} = R$ {(it.meters * it.pricePerMeter).toFixed(2)}</div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Total: R$ {total.toFixed(2)}</strong>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={clear}>Limpar</button>
              <Link href="/checkout">Ir para checkout →</Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

//1104407Joao*//
