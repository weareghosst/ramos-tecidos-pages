import Link from "next/link";
import Header from "../components/Header";
import Container from "../components/Container";
import ProductCard from "../components/ProductCard";
import { SpeedInsights } from "@vercel/speed-insights/next"

const featured = [
  { id: "1", name: "Tricoline Floral Azul", price_per_meter: 24.9, slug: "tricoline-floral-azul" },
  { id: "2", name: "Algodão Cru", price_per_meter: 18.5, slug: "algodao-cru" },
  { id: "3", name: "Oxford Liso Preto", price_per_meter: 22.0, slug: "oxford-liso-preto" },
  { id: "4", name: "Linho Misto Natural", price_per_meter: 39.9, slug: "linho-misto-natural" },
  { id: "5", name: "Jeans Leve Azul", price_per_meter: 34.9, slug: "jeans-leve-azul" },
  { id: "6", name: "Viscolycra Preta", price_per_meter: 29.9, slug: "viscolycra-preta" },
  { id: "7", name: "Tule Cristal", price_per_meter: 16.9, slug: "tule-cristal" },
  { id: "8", name: "Cetim Charmouse", price_per_meter: 27.5, slug: "cetim-charmouse" },
  { id: "9", name: "Sarja Colorida", price_per_meter: 31.9, slug: "sarja-colorida" },
];

const newArrivals = [
  { id: "n1", name: "Tricoline Poá Vermelho", price_per_meter: 26.9, slug: "tricoline-poa-vermelho" },
  { id: "n2", name: "Linho Bege Claro", price_per_meter: 41.0, slug: "linho-bege-claro" },
  { id: "n3", name: "Crepe Toque Seda", price_per_meter: 36.5, slug: "crepe-toque-seda" },
  { id: "n4", name: "Moletom Flanelado", price_per_meter: 44.9, slug: "moletom-flanelado" },
  { id: "n5", name: "Malha Ribana", price_per_meter: 28.9, slug: "malha-ribana" },
  { id: "n6", name: "Tricoline Xadrez", price_per_meter: 25.9, slug: "tricoline-xadrez" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-10">
        <Container>
          {/* HERO */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Ramos Tecidos</h1>
                <p className="mt-2 max-w-2xl text-white/70">
                  Tecidos por metro com compra rápida no Pix. Escolha a metragem em múltiplos de 0,5m e finalize seu pedido em minutos.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/produtos"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition"
                  >
                    Ver catálogo
                  </Link>

                  <Link
                    href="/carrinho"
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
                  >
                    Ir para o carrinho
                  </Link>
                </div>
              </div>

              {/* “Banner” visual simples */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:w-[320px]">
                <p className="text-sm font-semibold text-white">Pagamento</p>
                <p className="mt-1 text-white/70">Pix (rápido)</p>

                <div className="mt-4 grid gap-2 text-sm text-white/70">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">✅ Pedido registrado na hora</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">✅ Atendimento via WhatsApp</div>
                </div>
              </div>
            </div>
          </section>

          {/* DESTAQUES */}
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Destaques</h2>
                <p className="mt-1 text-sm text-white/60">Os tecidos mais procurados.</p>
              </div>

              <Link
                href="/produtos"
                className="text-sm font-semibold text-white/80 hover:text-white transition"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>

          {/* NOVIDADES */}
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Novidades</h2>
                <p className="mt-1 text-sm text-white/60">Chegaram agora — dá uma olhada.</p>
              </div>

              <Link
                href="/produtos"
                className="text-sm font-semibold text-white/80 hover:text-white transition"
              >
                Ver catálogo →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>

          {/* BENEFÍCIOS */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold">✅ Compra rápida</p>
              <p className="mt-1 text-sm text-white/60">Checkout direto e sem complicação.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold">✅ Múltiplos de 0,5m</p>
              <p className="mt-1 text-sm text-white/60">Escolha a metragem ideal pro seu projeto.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold">✅ Atendimento</p>
              <p className="mt-1 text-sm text-white/60">Tire dúvidas pelo WhatsApp.</p>
            </div>
          </section>

          {/* CTA FINAL */}
          <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Pronto pra escolher seu tecido?</h3>
                <p className="mt-1 text-sm text-white/60">
                  Veja o catálogo completo e finalize no Pix.
                </p>
              </div>

              <Link
                href="/produtos"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
              >
                Ir para produtos
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
