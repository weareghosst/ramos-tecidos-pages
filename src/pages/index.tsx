import Image from "next/image";
import Link from "next/link";
import ProductCard, {
  type ProductCardProduct,
} from "../components/ProductCard";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { createClient } from "@supabase/supabase-js";

type HomeProps = {
  products: ProductCardProduct[];
};

export default function Home({ products }: HomeProps) {
  return (
    <>
      <SpeedInsights />

      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {/* LOGO */}
            <div className="mb-4">
              <Image
                src="/logo-ramos.png"
                alt="Ramos Tecidos"
                width={160}
                height={160}
                priority
                className="h-auto w-auto max-h-[90px]"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ramos Tecidos
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600">
              Tecidos por metro com compra rápida no Pix. Escolha a metragem em
              múltiplos de <strong>0,5m</strong> e finalize seu pedido em minutos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/produtos" className="btn-primary px-5 py-3">
                Ver catálogo
              </Link>

              <Link href="/carrinho" className="btn-outline px-5 py-3">
                Ir para o carrinho
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="badge bg-slate-100 text-slate-700">Pix rápido</span>
              <span className="badge bg-slate-100 text-slate-700">Sem cadastro</span>
              <span className="badge bg-slate-100 text-slate-700">Compra por metro</span>
            </div>
          </div>

          <div className="card p-5 lg:w-[360px]">
            <p className="text-sm font-semibold text-slate-900">Pagamento</p>
            <p className="mt-1 text-slate-600">Pix (rápido)</p>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                ✅ Pedido registrado na hora
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                ✅ Atendimento via WhatsApp
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-4 btn-primary w-full px-5 py-3"
            >
              Finalizar agora
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Produtos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Todos os tecidos cadastrados na loja.
            </p>
          </div>

          <Link
            href="/produtos"
            className="text-sm font-semibold text-slate-900 hover:text-slate-700"
          >
            Ver todos →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-slate-600">
            Nenhum produto cadastrado ainda.
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="font-semibold">✅ Compra rápida</p>
          <p className="mt-1 text-sm text-slate-600">
            Checkout direto e sem complicação.
          </p>
        </div>

        <div className="card p-5">
          <p className="font-semibold">✅ Múltiplos de 0,5m</p>
          <p className="mt-1 text-sm text-slate-600">
            Escolha a metragem ideal pro seu projeto.
          </p>
        </div>

        <div className="card p-5">
          <p className="font-semibold">✅ Atendimento</p>
          <p className="mt-1 text-sm text-slate-600">
            Tire dúvidas pelo WhatsApp.
          </p>
        </div>
      </section>

      <section className="mt-12 card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              Pronto pra escolher seu tecido?
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Veja o catálogo completo e finalize no Pix.
            </p>
          </div>

          <Link href="/produtos" className="btn-primary px-5 py-3">
            Ir para produtos
          </Link>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price_per_meter, image_url, slug")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("home products error:", error);

    return {
      props: {
        products: [],
      },
    };
  }

  return {
    props: {
      products: (data || []) as ProductCardProduct[],
    },
  };
}