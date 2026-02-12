// src/lib/cart.ts
export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number; // em reais
  image?: string | null;
  meters: number; // sempre múltiplo de 0.5
};

const CART_KEY = "ramos_tecidos_cart_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, "meters"> & { meters: number }) {
  const meters = roundToHalf(item.meters);
  if (meters <= 0) return;

  const cart = getCart();
  const idx = cart.findIndex((c) => c.id === item.id);

  if (idx >= 0) {
    cart[idx] = {
      ...cart[idx],
      meters: roundToHalf(cart[idx].meters + meters),
    };
  } else {
    cart.push({ ...item, meters });
  }

  setCart(cart);
}

export function updateCartMeters(productId: string, meters: number) {
  const m = roundToHalf(meters);
  const cart = getCart();
  const idx = cart.findIndex((c) => c.id === productId);
  if (idx < 0) return;

  if (m <= 0) cart.splice(idx, 1);
  else cart[idx] = { ...cart[idx], meters: m };

  setCart(cart);
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter((c) => c.id !== productId);
  setCart(cart);
}

export function cartCountItems() {
  return getCart().length;
}
