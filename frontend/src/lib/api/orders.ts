import { api } from "./client";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrdersListResponse,
  OrderDetailResponse,
} from "@/types/order";

// דורש login (cookie) - docs/API_CONTRACT.md. אם ה-session לא בתוקף בפועל
// (למשל פג/בוטל בצד השרת בזמן שה-authStore בצד הלקוח עדיין "חושב" שהמשתמש
// מחובר - ראו הערה ב-stores/authStore.ts) התגובה תהיה 401 רגיל - לא נתפס
// כאן; הקורא (CheckoutPage) אחראי לתפוס ApiError ולהחזיר את ה-UI למצב
// "לא מחובר".
export function createOrder(payload: CreateOrderRequest) {
  return api.post<CreateOrderResponse>("/orders", payload);
}

// שתי הבאות דורשות login בדיוק כמו createOrder למעלה - ראו docs/API_CONTRACT.md
// "GET /orders" / "GET /orders/:id". הקוראים (OrdersPage/OrderDetailPage) לא
// מפעילים את ה-query כלל כשאין user מחובר (enabled: false) - אין טעם לשלוח
// בקשה שידוע מראש שתיכשל ב-401; ואם בכל זאת מתקבל 401 (session פג בין
// הרגע שה-authStore חשב "מחובר" לרגע הקריאה בפועל) - הקורא אחראי לתפוס
// ApiError ולאפס את authStore.user, בדיוק כמו ב-CheckoutPage.
export function getOrders(signal?: AbortSignal) {
  return api.get<OrdersListResponse>("/orders", { signal });
}

export function getOrder(orderId: string, signal?: AbortSignal) {
  return api.get<OrderDetailResponse>(`/orders/${orderId}`, { signal });
}
