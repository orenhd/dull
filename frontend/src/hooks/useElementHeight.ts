// נוסף 2026-09-23 (PRD.md סעיף 53, דיווח אורן) - hook גנרי למדידת הגובה
// המוצג בפועל של אלמנט (ResizeObserver, אותו idiom בדיוק כמו
// ConsentBanner.tsx/useStickyBottomOffset.ts). ההבדל מ-useStickyBottomOffset:
// שם אלמנט מודד אלמנט *אחר* (הבאנר/הפוטר) כדי לדעת איפה למקם את עצמו; כאן
// אלמנט מודד את *עצמו*, כדי שתוכן אחר (העמוד שמתחתיו) ידע כמה מקום לשמור.
//
// למה זה בכלל נדרש: הבארים הדביקים בתחתית (CartPage.tsx/CheckoutPage.tsx,
// גם StickyAddToBagBar.tsx) הפכו ל-position:fixed בסעיף 52 (כדי לפתור באג
// חפיפה עם ConsentBanner.tsx - ראו הערה מלאה ב-StickyAddToBagBar.tsx).
// position:fixed מוציא את האלמנט **לגמרי** מזרימת המסמך - שום padding לא
// "נשמר" בשבילו אוטומטית יותר, בניגוד ל-sticky (שעדיין תופס מקום בזרימה
// הרגילה). התוצאה שדיווח אורן: ב-CartPage.tsx לא היה אפשר לגלול עד ממש
// לתחתית התוכן, וב-CheckoutPage.tsx (שם הבר הדביק גבוה משמעותית - כותרת+
// רשימת פריטים+סה"כ+כפתור, לא רק סה"כ+כפתור) לא היה אפשר לגלול כלל - תוכן
// הטופס כבר "נכנס" בגובה ה-<main> הזמין (שהתקצר כי הבר כבר לא תורם לו
// גובה), אז main לא חשב שיש בכלל צורך לגלול, למרות שחלק מהתוכן (כולל שדות
// טופס בפועל!) חבוי מתחת לבר האטום. הפתרון: מדידת הגובה בפועל של הבר
// (hook זה) ושמירת padding-bottom תואם על התוכן הגולל - ראו שימוש
// ב-CartPage.tsx/CheckoutPage.tsx.
import { useEffect, useState, type RefObject } from "react";

export function useElementHeight<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
