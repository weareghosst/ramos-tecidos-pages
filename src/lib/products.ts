// src/lib/products.ts
export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number; // R$
  image?: string | null;
  description?: string | null;
  minMeters?: number; // default 0.5
};

const MOCK: Product[] = [
  {
    id: "1",
    slug: "tricoline-lisa-branca",
    name: "Tricoline Lisa Branca",
    price: 19.9,
    image: "/products/tricoline-branca.jpg",
    description: "Tricoline 100% algodão. Ideal para camisaria, patchwork e artesanato.",
    minMeters: 0.5,
  },
  {
    id: "2",
    slug: "oxford-preto",
    name: "Oxford Preto",
    price: 14.9,
    image: "/products/oxford-preto.jpg",
    description: "Oxford clássico para uniformes e projetos diversos.",
    minMeters: 0.5,
  },
];

// TODO: substitua por Supabase / seu backend real
export async function listProducts(): Promise<Product[]> {
  return MOCK;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return MOCK.find((p) => p.slug === slug) ?? null;
}
