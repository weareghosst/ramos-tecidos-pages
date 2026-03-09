import type { CartItem } from "@/types/catalog";

const STORAGE_KEY = "ramos_cart_v2";

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCart(): CartItem[] {
  return readStorage();
}

export function clearCart() {
  writeStorage([]);
}

export function cartCountItems(): number {
  return readStorage().length;
}

export function buildCartItemId(productId: string, variantId: string | null) {
  return `${productId}__${variantId || "sem-variante"}`;
}

export function addToCart(item: Omit<CartItem, "id">) {
  const items = readStorage();
  const generatedId = buildCartItemId(item.product_id, item.variant_id);

  const existingIndex = items.findIndex((i) => i.id === generatedId);

  if (existingIndex >= 0) {
    items[existingIndex].meters = Number(
      (items[existingIndex].meters + item.meters).toFixed(2)
    );
  } else {
    items.push({
      ...item,
      id: generatedId,
    });
  }

  writeStorage(items);
}

export function updateCartMeters(id: string, meters: number) {
  const safeMeters = Math.max(0.5, Math.round(meters * 2) / 2);

  const items = readStorage().map((item) =>
    item.id === id ? { ...item, meters: safeMeters } : item
  );

  writeStorage(items);
}

export function removeFromCart(id: string) {
  const items = readStorage().filter((item) => item.id !== id);
  writeStorage(items);
}