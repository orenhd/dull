import { api } from "./client";
import type { Locale } from "@/constants";
import type { ProductResponse, ProductsListResponse } from "@/types/product";

export function getProducts(locale: Locale, signal?: AbortSignal) {
  return api.get<ProductsListResponse>("/products", { locale, signal });
}

export function getProduct(slug: string, locale: Locale, signal?: AbortSignal) {
  return api.get<ProductResponse>(`/products/${slug}`, { locale, signal });
}
