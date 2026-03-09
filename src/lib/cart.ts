export type CartItem = {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  image_url: string | null;
  meters: number;
  price_per_meter: number;
  variant_id: string | null;
  color_name: string | null;
  color_hex: string | null;
};

const STORAGE_KEY = "ramos_cart_v2";

function getStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as CartItem[];
  } catch {
    return [];
  }
}

function saveStorage(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCart(): CartItem[] {
  return getStorage();
}

export function buildCartItemId(productId: string, variantId: string | null) {
  return `${productId}__${variantId || "sem-variante"}`;
}

export function addToCart(
  item: Omit<CartItem, "id">
) {
  const cart = getStorage();
  const generatedId = buildCartItemId(item.product_id, item.variant_id);

  const existingIndex = cart.findIndex((i) => i.id === generatedId);

  if (existingIndex >= 0) {
    cart[existingIndex].meters += item.meters;
  } else {
    cart.push({
      ...item,
      id: generatedId,
    });
  }

  saveStorage(cart);
}

export function updateCartMeters(id: string, meters: number) {
  const safeMeters = Math.max(0.5, Math.round(meters * 2) / 2);

  const cart = getStorage().map((item) =>
    item.id === id ? { ...item, meters: safeMeters } : item
  );

  saveStorage(cart);
}

export function removeFromCart(id: string) {
  const cart = getStorage().filter((i) => i.id !== id);
  saveStorage(cart);
}

export function clearCart() {
  saveStorage([]);
}

export function cartCountItems(): number {
  return getStorage().length;
}