// טיפוסי בקשה/תגובה ל-POST /orders (docs/API_CONTRACT.md). מבנה
// shippingAddress לא סופי שם במפורש ("כל מבנה - טופס המשלוח עוד לא נקבע
// סופית ב-PRD") - הצורה כאן היא ההחלטה הראשונה בפועל בצד ה-frontend (סט
// שדות מינימלי: שם מלא, טלפון, כתובת, עיר, מיקוד - ראו docs/PRD.md סעיף
// 12.5), לא אימות מול ה-backend שאלה בדיוק השדות שהוא מצפה להם - הוא לא
// מוולד אותם, רק מעביר JSON חופשי הלאה.
import type { LocalizedText } from "@/lib/localize";
import type { Locale } from "@/constants";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
}

export interface OrderItemInput {
  productVariantId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemInput[];
  shippingAddress: ShippingAddress;
}

// תגובת ההצלחה כוללת עוד שדות מעבר לאלה (ה-"..." בדוגמת ה-contract) - רק
// השדות שמסך האישור בפועל צריך מטופסים כאן, לא כל המבנה.
export interface Order {
  id: string;
  totalAgorot: number;
}

export interface CreateOrderResponse {
  order: Order;
}

// קודי השגיאה הידועים מה-contract (400) - productVariantId מזהה איזה
// פריט בעגלה נכשל, כדי שאפשר יהיה להציג הודעה ממוקדת.
export type OrderErrorCode = "VARIANT_NOT_FOUND" | "OUT_OF_STOCK";

export interface OrderErrorBody {
  error: OrderErrorCode;
  productVariantId: string;
}

// --- היסטוריית הזמנות (GET /orders, GET /orders/:id) ---
// שונה מהותית מ-Order/CreateOrderResponse למעלה: אלה השדות המלאים כפי
// שנשמרים ב-DB (ראו backend/prisma/schema.prisma, model Order/OrderItem),
// לא רק מה שמסך האישור המיידי צריך. חשוב: productNameSnapshot מגיע כאן
// *גולמי* ({ en, he }) - ל-GET /orders ו-GET /orders/:id אין פרמטר locale
// בכלל (docs/API_CONTRACT.md), בניגוד ל-/products שכבר ממוקד בצד השרת -
// יש לעטוף עם localizeText() (src/lib/localize.ts) לפני תצוגה.

export type OrderStatus = "PLACED" | "FULFILLED" | "CANCELLED";

export interface OrderLineItem {
  id: string;
  productVariantId: string;
  quantity: number;
  unitPriceAgorot: number;
  productNameSnapshot: LocalizedText;
  // נוסף 2026-09-09 (docs/API_CONTRACT.md, "צורת OrderItem"): snapshot של
  // תיאור הבחירה (Fit/Colorway/Size...) בזמן הרכישה. Record<Locale, string[]>
  // ולא LocalizedText (מחרוזת מוכנה) בכוונה - ה-backend מכוון להחזיר array
  // של הרכיבים הלא-מחוברים לכל locale (backend/src/lib/variantLabel.ts;
  // שימו לב, ה-JSON example ב-API_CONTRACT.md עצמו מציג בטעות מחרוזת
  // מחוברת - הקוד, לא הדוגמה, הוא המקור-אמת כאן, ראו הערת פתיחה של אותו
  // מסמך). חיבור הרכיבים למחרוזת תצוגה הוא עניין frontend-י - ראו
  // joinSelectionLabelParts() ב-lib/variant.ts, אותה פונקציה שמשמשת גם את
  // תווית הבחירה בעגלה. null בהזמנות שבוצעו לפני ה-migration (2026-09-09).
  selectionLabelSnapshot: Record<Locale, string[]> | null;
  // נתיב יחסי (כמו flatImageUrl במקומות אחרים) - לצרף עם resolveMediaUrl()
  // (lib/api/client.ts). null בהזמנות ישנות, או אם לא נמצאה תמונת flat
  // תואמת לבחירה בזמן הרכישה.
  flatImageUrlSnapshot: string | null;
}

// shippingAddress הוא Json חופשי בצד ה-backend (לא מוולד מול סכימה קבועה),
// אבל בפועל תמיד נשלח מכאן בצורת ShippingAddress (למעלה) - Partial כאן
// כהגנה בלבד, שהזמנה עם שדות חסרים לא תקריס את מסך הפירוט.
export interface OrderRecord {
  id: string;
  status: OrderStatus;
  totalAgorot: number;
  isSimulatedPayment: boolean;
  shippingAddress: Partial<ShippingAddress>;
  createdAt: string; // ISO
  items: OrderLineItem[];
}

export interface OrdersListResponse {
  orders: OrderRecord[];
}

export interface OrderDetailResponse {
  order: OrderRecord;
}
