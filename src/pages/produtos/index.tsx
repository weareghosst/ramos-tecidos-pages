import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FABRIC_TYPES = [
  "Todos",
  "Tricoline Lisa",
  "Tricoline Estampada",
  "Tricoline Digital",
  "Malhas",
  "Mantas e Fibras",
  "Outros",
];

export default function Produtos() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [ready, setReady] = useState(false);

  // lê os parâmetros da URL quando a página carrega (ex: vindo da home)
  useEffect(() => {
    if (!router.isReady) return;

    const searchParam = String(router.query.search || "");
    const typeParam = String(router.query.type || "");

    if (searchParam) setSearch(searchParam);
    if (typeParam && FABRIC_TYPES.includes(typeParam)) setSelectedType(typeParam);

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
    setSearch("");
    setSelectedType("Todos");
    router.replace("/produtos", undefined, { shallow: true });
  }

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Produtos
          </h1>
          <p className="mt-2 text-slate-600">
            Encontre o tecido ideal para o seu projeto.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              placeholder="O que você procura?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={handleClear}
              className="btn-outline px-4 py-3"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FABRIC_TYPES.map((type) => {
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {!ready || isLoading ? (
          <div className="card p-6 text-slate-600">Carregando produtos...</div>
        ) : products.length === 0 ? (
          <div className="card p-6 text-slate-600">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
