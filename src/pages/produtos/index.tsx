import Header from "../../components/Header";
import Container from "../../components/Container";
import ProductCard from "../../components/ProductCard";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Produtos() {
  const { data, isLoading } = useSWR("/api/products", fetcher);

  const products = data?.products || [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main className="py-10">
        <Container>
          <h1 className="mb-6 text-3xl font-bold">
            Produtos
          </h1>

          {isLoading && <p>Carregando produtos...</p>}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </Container>
      </main>
    </div>
  );
}
