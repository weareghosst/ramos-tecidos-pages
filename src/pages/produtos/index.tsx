import Header from "../../components/Header";
import Container from "../../components/Container";
import ProductCard from "../../components/ProductCard";
import { SpeedInsights } from "@vercel/speed-insights/next"

const products = [
  {
    id: "1",
    name: "Tricoline Floral Azul",
    price_per_meter: 24.9,
    slug: "tricoline-floral-azul",
  },
  {
    id: "2",
    name: "Algodão Cru",
    price_per_meter: 18.5,
    slug: "algodao-cru",
  },
];

export default function Produtos() {
  return (
  <div className="min-h-screen bg-soft text-white">

      <Header />
      <main className="py-10">
        <Container>
          <h1 className="mb-6 text-3xl font-bold">Produtos</h1>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </main>
    </div>
  );
}
