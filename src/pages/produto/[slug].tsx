import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Header from "../../components/Header";
import Container from "../../components/Container";

const products = [
  {
    id: "1",
    slug: "tricoline-floral-azul",
    name: "Tricoline Floral Azul",
    price_per_meter: 24.9,
    description:
      "Tricoline premium, ideal para roupas leves, patchwork e artesanato. Toque macio e excelente caimento.",
    image: "",
  },
  {
    id: "2",
    slug: "algodao-cru",
    name: "Algodão Cru",
    price_per_meter: 18.5,
    description:
      "Algodão cru versátil para artesanato, forros e costura em geral. Ótimo custo-benefício.",
    image: "",
  },
];

const CART_KEY = "ramos_cart_v1";

function formatBRL(value?: number) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <div className="rounded-2xl border border-white/15 bg-black/80 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
        {message}
      </div>
    </div>
  );
}

export default function ProdutoPage() {
  const router = useRouter();
  const slug = String(router.query.slug || "");

  const product = useMemo(
    () => products.find((p) => p.slug === slug),
    [slug]
  );

  const [meters, setMeters] = useState(0.5);
  const [toast, setToast] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const total = useMemo(() => {
    if (!product) return 0;
    return (meters || 0) * (product.price_per_meter || 0);
  }, [product, meters]);

  function addToCart() {
    if (!product) return;

    setAdding(true);

    try {
      const raw = localStorage.getItem(CART_KEY);
      const current = raw ? JSON.parse(raw) : [];

      const idx = current.findIndex((i: any) => i.slug === product.slug);
      if (idx >= 0) {
        current[idx].meters = Number(((current[idx].meters || 0) + meters).toFixed(2));
      } else {
        current.push({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price_per_meter: product.price_per_meter,
          meters,
        });
      }

      localStorage.setItem(CART_KEY, JSON.stringify(current));

      setToast("Adicionado ao carrinho ✅");
      // deixa o toast aparecer e manda pro carrinho
      setTimeout(() => router.push("/carrinho"), 650);
    } finally {
      setTimeout(() => setAdding(false), 700);
      setTimeout(() => setToast(null), 1400);
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="py-10">
          <Container>
            <p className="text-white/70">Produto não encontrado.</p>
            <Link className="mt-4 inline-block text-white underline" href="/produtos">
              Voltar para produtos
            </Link>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-10">
        <Container>
          <div className="mb-6 text-sm text-white/60">
            <Link href="/produtos" className="hover:text-white">
              Produtos
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{product.name}</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Imagem */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="aspect-square w-full rounded-xl bg-white/10 flex items-center justify-center text-white/40 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover rounded-xl transition hover:scale-[1.02]"
                  />
                ) : (
                  <span>Foto do tecido</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="aspect-square rounded-xl bg-white/10" />
                <div className="aspect-square rounded-xl bg-white/10" />
                <div className="aspect-square rounded-xl bg-white/10" />
              </div>
            </div>

            {/* Infos + compra */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-3xl font-bold">{product.name}</h1>

              <p className="mt-2 text-white/70">{product.description}</p>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60">Preço</p>
                  <p className="text-2xl font-semibold">
                    {formatBRL(product.price_per_meter)}{" "}
                    <span className="text-sm font-normal text-white/60">/ metro</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-white/60">Total</p>
                  <p className="text-2xl font-semibold">{formatBRL(total)}</p>
                </div>
              </div>

              {/* Seletor de metros */}
              <div className="mt-6">
                <p className="text-sm text-white/60">Selecione a metragem</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {[0.5, 1, 1.5, 2, 2.5, 3].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMeters(m)}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-semibold border transition",
                        meters === m
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white border-white/15 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {String(m).replace(".", ",")} m
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-xs text-white/60">
                  * Vendemos em múltiplos de <b>0,5m</b>.
                </div>
              </div>

              {/* Botões */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={addToCart}
                  disabled={adding}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition disabled:opacity-60"
                >
                  {adding ? "Adicionando..." : "Adicionar ao carrinho"}
                </button>

                <Link
                  href="/carrinho"
                  className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
                >
                  Ver carrinho
                </Link>
              </div>

              <p className="mt-3 text-xs text-white/60">
                Pagamento via Pix • Pedido registrado na hora • Atendimento no WhatsApp
              </p>

              {/* Benefícios */}
              <div className="mt-6 grid gap-3 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  ✅ Atendimento via WhatsApp
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  ✅ Pagamento via Pix (rápido)
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  ✅ Qualidade garantida
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
