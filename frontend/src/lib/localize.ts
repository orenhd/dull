// שדה טקסט רב-לשוני כפי שנשמר ב-DB ({ en, he } - ראו backend/prisma/schema.prisma,
// למשל Product.name / OrderItem.productNameSnapshot). רוב ה-API כבר "שוטח"
// את זה בצד השרת ל-string פשוט לפי פרמטר locale (ראו src/types/product.ts),
// אבל GET /orders ו-GET /orders/:id לא עושים זאת - אין להם פרמטר locale
// בכלל (docs/API_CONTRACT.md) - היחידים במסמך שמחזירים ל-frontend את הצורה
// הגולמית. זה ה-helper שממיר אותה לתצוגה בשפה הנוכחית.
import type { Locale } from "@/constants";

export interface LocalizedText {
  en: string;
  he?: string;
  [locale: string]: string | undefined;
}

// נופל לאנגלית אם התרגום בשפה המבוקשת חסר (לא אמור לקרות בפועל - כל seed
// כולל שתי שפות), ולמחרוזת ריקה אם גם אנגלית חסרה (הגנה בלבד - לא מצופה).
export function localizeText(value: LocalizedText | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] ?? value.en ?? "";
}
