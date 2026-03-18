import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FABRIC_TYPES = [
  "Todos","Tricoline Lisa","Tricoline Estampada","Tricoline Digital",
  "Malhas","Mantas e Fibras","Outros",
];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
.rt-page { background: #faf8f5; font-family: 'DM Sans', sans-serif; }
.rt-title { font-family: 'Cormorant Garamond', serif; font-weight: 400; color: #1a1510; }
.rt-label {
  display: inline-flex; align-items: center; gap: 12px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
  text-transform: uppercase; color: #c9a96e; margin-bottom: 0.5rem;
}
.rt-label::after { content:''; display:block; width:32px; height:1px; background:#c9a96e; }
.rt-search-wrap {
  background: white; border: 1px solid #e8e2d9; border-radius: 4px; padding: 16px;
}
.rt-search {
  width: 100%; border: 1px solid #e8e2d9; border-radius: 4px;
  padding: 11px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px;
  color: #1a1510; outline: none; transition: border-color 0.2s; background: #faf8f5;
}
.rt-search:focus { border-color: #c9a96e; }
.rt-search::placeholder { color: #9a8f82; }
.rt-clear {
  padding: 11px 20px; border: 1px solid #e8e2d9; border-radius: 4px;
  font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  color: #9a8f82; background: white; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.rt-clear:hover { border-color: #c9a96e; color: #c9a96e; }
.rt-pill {
  padding: 7px 18px; border: 1px solid #e8e2d9; border-radius: 99px;
  font-size: 12px; font-weight: 400; color: #9a8f82; background: white;
  cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em;
}
.rt-pill:hover { border-color: #c9a96e; color: #c9a96e; }
.rt-pill.active { background: #1a1510; color: #faf8f5; border-color: #1a1510; }
`;

export default function Produtos() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const s = String(router.query.search || "");
    const t = String(router.query.type || "");
    if (s) setSearch(s);
    if (t && FABRIC_TYPES.includes(t)) setSelectedType(t);
    setReady(true);
  }, [router.isReady, router.query.search, router.query.type]);

  const apiUrl = useMemo(() => {
    if (!ready) return null;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedType !== "Todos") params.set("type", selectedType);
    return `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
  }, [search, selectedType, ready]);

  const { data, isLoading } = useSWR(apiUrl, fetcher);
  const products = data?.products || [];

  function handleClear() {
    setSearch(""); setSelectedType("Todos");
    router.replace("/produtos", undefined, { shallow: true });
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="rt-page" style={{ minHeight: "100vh", padding: "3rem 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>

          {/* CABEÇALHO */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div className="rt-label">Catálogo</div>
            <h1 className="rt-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "0.5rem" }}>
              Nossos tecidos
            </h1>
            <p style={{ color: "#9a8f82", fontSize: "15px" }}>
              Encontre o tecido ideal para o seu projeto.
            </p>
          </div>

          {/* BUSCA E FILTROS */}
          <div className="rt-search-wrap" style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="O que você procura?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rt-search"
              />
              <button type="button" onClick={handleClear} className="rt-clear">
                Limpar
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {FABRIC_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rt-pill${selectedType === type ? " active" : ""}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUTOS */}
          {!ready || isLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9a8f82" }}>Carregando produtos...</div>
          ) : products.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9a8f82" }}>Nenhum produto encontrado.</div>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "#9a8f82", marginBottom: "1.5rem" }}>
                {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
