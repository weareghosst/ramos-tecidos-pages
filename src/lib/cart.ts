import { CartItem } from "../types/catalog";

const CART_KEY = "ramos-tecidos-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function buildCartItemId(productId: string, variantId: string | null) {
  return `${productId}__${variantId || "sem-variante"}`;
}

export function addToCart(item: Omit<CartItem, "id">) {
  const items = getCart();
  const generatedId = buildCartItemId(item.product_id, item.variant_id);

  const existingIndex = items.findIndex((cartItem) => cartItem.id === generatedId);

  if (existingIndex >= 0) {
    items[existingIndex].meters += item.meters;
  } else {
    items.push({
      ...item,
      id: generatedId,
    });
  }

  saveCart(items);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function updateCartItemMeters(id: string, meters: number) {
  const items = getCart().map((item) =>
    item.id === id ? { ...item, meters } : item
  );

  saveCart(items);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function removeCartItem(id: string) {
  const items = getCart().filter((item) => item.id !== id);
  saveCart(items);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart() {
  saveCart([]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}