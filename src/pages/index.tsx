import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data } = useSWR("/api/products", fetcher);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const products = data?.products || [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/produtos?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <Container>
      <div className="space-y-16">

        {/* HERO */}
        <section className="grid md:grid-cols-2 gap-10 items-center">

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight text-slate-900">
              Tecidos de qualidade
              <br />
              para suas criações
            </h1>

            <p className="text-lg text-slate-600">
              Tricoline lisa, estampada, digital e muito mais.
              Venda por metro com entrega rápida.
            </p>

            {/* BARRA DE PESQUISA */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="O que você procura?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                className="btn-primary px-5 py-3 rounded-xl"
              >
                Buscar
              </button>
            </form>

            <div className="flex gap-4">
              <Link
                href="/produtos"
                className="btn-primary px-6 py-3 text-lg"
              >
                Ver tecidos
              </Link>

              <Link
                href="/produtos?type=Tricoline%20Estampada"
                className="btn-outline px-6 py-3 text-lg"
              >
                Estampados
              </Link>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/banner-tecidos.jpg"
              alt="Tecidos"
              className="w-full h-full object-cover"
            />
          </div>

        </section>

        {/* CATEGORIAS */}
        <section className="space-y-6">

          <h2 className="text-3xl font-bold">
            Tipos de tecidos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <Link href="/produtos?type=Tricoline%20Lisa" className="card p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg">Tricoline Lisa</h3>
              <p className="text-sm text-slate-500">Tecidos básicos</p>
            </Link>

            <Link href="/produtos?type=Tricoline%20Estampada" className="card p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg">Tricoline Estampada</h3>
              <p className="text-sm text-slate-500">Estampas variadas</p>
            </Link>

            <Link href="/produtos?type=Tricoline%20Digital" className="card p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg">Tricoline Digital</h3>
              <p className="text-sm text-slate-500">Alta definição</p>
            </Link>

            <Link href="/produtos?type=Malhas" className="card p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg">Malhas</h3>
              <p className="text-sm text-slate-500">Elasticidade e conforto</p>
            </Link>

          </div>

        </section>

        {/* PRODUTOS */}
        <section className="space-y-6">

          <div className="flex justify-between items-center">

            <h2 className="text-3xl font-bold">
              Produtos em destaque
            </h2>

            <Link
              href="/produtos"
              className="text-sm text-slate-600 hover:underline"
            >
              Ver todos
            </Link>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {products.slice(0, 8).map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}

          </div>

        </section>

      </div>
    </Container>
  );
}
