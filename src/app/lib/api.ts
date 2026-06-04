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

const BACKEND_BASE_URL = "/api";
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

function parseResponseBody(text: string): unknown {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function stringifyDetails(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "Не удалось прочитать детали ошибки.";
    }
  }

  return String(value || "Неизвестная ошибка");
}

function apiErrorMessage(status: number, path: string, data: unknown): string {
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const serverError = payload.error ?? payload.message ?? payload.raw;

  if (status === 403) {
    return `Сервер запретил доступ к ${BACKEND_BASE_URL}${path}. Проверьте, что папка api загружена в httpdocs, PHP-файлы имеют права 644, папка api имеет права 755, и домен открывает именно этот httpdocs.`;
  }

  if (status === 404) {
    return `Файл ${BACKEND_BASE_URL}${path} не найден на хостинге. Проверьте, что вся папка api загружена в httpdocs.`;
  }

  if (serverError) {
    return stringifyDetails(serverError);
  }

  return `Ошибка запроса к серверу. HTTP ${status}.`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      signal: options.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    const data = parseResponseBody(text);

    if (!response.ok) {
      throw new Error(apiErrorMessage(response.status, path, data));
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Серверная папка /api не ответила вовремя. Проверьте backend на хостинге.");
    }
    if (error instanceof TypeError) {
      throw new Error("Не удалось подключиться к серверной папке /api. Проверьте, что сайт и папка api загружены в один httpdocs на PHP-хостинге.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function formatPrice(price: number) {
  return `${Number(price).toLocaleString("ru-RU")}₸`;
}
