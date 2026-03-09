export type ProductVariant = {
  id?: string;
  product_id?: string;
  color_name: string;
  color_hex: string | null;
  image_url: string | null;
  stock_meters: number;
  active: boolean;
  created_at?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_per_meter: number;
  stock_meters: number;
  image_url: string | null;
  active: boolean;
  created_at?: string;
  variants?: ProductVariant[];
};

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