// עיצוב מחיר לתצוגה לבן-אדם (למשל בטבלת פריטים במייל). לא לבלבל עם
// חישוב מחיר בפועל - זה תמיד קורה על priceAgorot כ-Int, זה רק תצוגה.
import { CURRENCY_SYMBOL } from "../constants/index.js";

export function formatAgorot(agorot: number): string {
  return `${CURRENCY_SYMBOL}${(agorot / 100).toFixed(2)}`;
}
