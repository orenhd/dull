// נוסף 2026-09-23 (PRD.md סעיף 55, בקשת אורן [ג]) - אייקון סל-קניות בקו
// אחד, מצויר ידנית כ-SVG inline - אין באתר שום ספריית אייקונים או קובצי
// SVG חיצוניים (גם ה-chevron בבורר המידה, VariantSelector.tsx, מצויר
// באותה שיטה בדיוק), אז זו המשך ישיר לאותה מוסכמה, לא תוספת חדשה. בכוונה
// לא "ריאליסטי"/עם מרקם קש בפועל - בגודל אייקון-הדר (24px) פירוט כזה לא
// היה קריא. `stroke="currentColor"` כדי שיירש צבע דרך `text-*`/`color`
// רגיל, בדיוק כמו טקסט - אין צורך ב-prop צבע נפרד.
//
// הידית (path עליון, קשת) היא ה"עוגן" המיועד לאנימציית הנענוע ב-
// SiteHeader.tsx (CartLink) - `origin-top` שם מסתמך על כך שהידית יושבת
// בדיוק בחלק העליון של ה-viewBox (y≈2-9 מתוך 0-24).
import type { SVGProps } from "react";

export function BasketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* ידית - קשת בין שני קצות גוף הסל */}
      <path d="M8 9C8 4.5 9.8 2 12 2C14.2 2 16 4.5 16 9" />
      {/* גוף הסל - טרפז (רחב למעלה, צר למטה) */}
      <path d="M4 9H20L18 19H6L4 9Z" />
    </svg>
  );
}
