export type UserRole = "customer" | "seller" | "admin";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: "active" | "blocked";
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_kzt: number;
  stock_quantity: number;
  rating: number;
  reviews_count: number;
  tag: string | null;
  ar_model_name: string | null;
  ar_model_url: string | null;
  main_image_url: string | null;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price_kzt: number;
  line_total_kzt: number;
  name: string;
  main_image_url: string | null;
  stock_quantity: number;
}

export interface CartPayload {
  items: CartItem[];
  total_kzt: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  total_kzt: number;
  items_count: number;
}

export interface AdminAction {
  id: number;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  username: string | null;
  name: string | null;
  role: UserRole | null;
}

const API_BASE = "/api";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Ошибка запроса к серверу");
  }

  return data as T;
}

export function formatPrice(price: number) {
  return `${Number(price).toLocaleString("ru-RU")}₸`;
}
