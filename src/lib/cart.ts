export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_per_meter: number;
  meters: number;
  image?: string | null; // ✅ corrigido aqui
};

const STORAGE_KEY = "ramos_cart_v1";

function getStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveStorage(cart: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function getCart(): CartItem[] {
  return getStorage();
}

export function addToCart(item: CartItem) {
  const cart = getStorage();

  const existingIndex = cart.findIndex(
    (i) => i.slug === item.slug
  );

  if (existingIndex >= 0) {
    cart[existingIndex].meters += item.meters;
  } else {
    cart.push({
      id: item.id,
      slug: item.slug,
      name: item.name,
      price_per_meter: Number(item.price_per_meter),
      meters: Number(item.meters),
      image: item.image ?? null, // ✅ corrigido aqui
    });
  }

  saveStorage(cart);
}

export function updateCartMeters(slug: string, meters: number) {
  const cart = getStorage();

  const index = cart.findIndex((i) => i.slug === slug);
  if (index >= 0) {
    cart[index].meters = meters;
  }

  saveStorage(cart);
}

export function removeFromCart(slug: string) {
  const cart = getStorage().filter((i) => i.slug !== slug);
  saveStorage(cart);
}

export function clearCart() {
  saveStorage([]);
}

export function cartCountItems(): number {
  const cart = getStorage();
  return cart.length;
}

export function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}
