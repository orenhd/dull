// עיצוב מחיר לתצוגה - מקביל ל-backend/src/lib/money.ts (formatAgorot).
// priceAgorot הוא תמיד מספר שלם באגורות (₪ * 100) - ראו docs/API_CONTRACT.md.
import { CURRENCY_SYMBOL } from "@/constants";

export function formatAgorot(agorot: number): string {
  return `${CURRENCY_SYMBOL}${(agorot / 100).toFixed(2)}`;
}
