// Marketing feedback - PDP buy box A2 (2026-09-19): פס Add to Bag דביק
// שמופיע במובייל בלבד כשהכפתור המקורי (ב-buy box) לא נראה. שני עקרונות
// מרכזיים מהבריף:
//
// 1. **אין לוגיקה מקבילה** - הכפתור כאן הוא `type="submit" form={formId}`,
//    בדיוק כמו שכפתור ה-submit ב-CheckoutPage.tsx כבר עושה מול הטופס שלו
//    (form="checkout-form") - שולח את אותו <form> בדיוק שהכפתור הרגיל
//    שולח, אז handleSubmit ב-AddToBagForm.tsx (ולידציה/הוספה לעגלה/toast/
//    אנליטיקה) רץ פעם אחת, בלי שום שכפול. ה-`data-source` על שני הכפתורים
//    (כאן ו-AddToBagForm.tsx) מבחין בין המקורות ב-handleSubmit דרך
//    SubmitEvent.submitter, לא state/prop נפרד.
//
// 2. **בלי מנגנון scroll ידני** - IntersectionObserver בלבד (לא
//    `scroll` listener) לבדיקת הנראות של הכפתור המקורי (למטה) - לא
//    polling/resize ידני, אחרת הפס לא יופיע נכון (הבריף, סעיף 2).
//
// === היסטוריית מיקום/z (סבב שלישי - קרא לפני שנוגעים בזה שוב!) ===
//
// **גרסה מקורית**: `position:sticky bottom-0` בזרימת ה-DOM של <main>.
// עבד מצוין - RootLayout.tsx בנוי כ-app-shell (h-[100dvh], flex column)
// שבו <main id="main"> הוא היחיד שגולל, ו-Footer.tsx צמוד תמיד לתחתית
// המסך מיד אחריו (לא חלק מהגלילה) - כך גבול ה-containing-block של הפס
// (=גבול <main>) מתלכד תמיד עם השורה שבה הפוטר מתחיל, ו-sticky "נעצר"
// שם מבנית, בלי חישוב.
//
// **ניסיון 1 (PRD סעיף 49)**: ConsentBanner.tsx (fixed, z-20) הסתיר את
// הפס לגמרי אצל מבקר/ת ראשון/ה - נוסה `bottom` דינמי (=גובה הבאנר) על
// אותו `position:sticky`. דווח כשגוי (הפס "צף" באמצע העמוד).
//
// **ניסיון 2 (סעיף 50)**: הוחלף - כל עוד הבאנר מוצג, הפס לא מוצג בכלל.
// עבד נכון, אך ויתר על הפיצ'ר שאורן רצה בסוף: שהפס "יערם" מעל הבאנר,
// לא ייעלם.
//
// **ניסיון 3 (הנוכחי) - אובחן ואומת אמפירית, לא רק נימוקית**: הזרקתי
// עותקים סינתטיים ישירות ל-DOM החי של dull.onrender.com (לא סביבת פיתוח
// מדומה) ובדקתי כמה מנגנונים אחד מול השני:
//   - `bottom` דינמי על `sticky` (ניסיון 1 המקורי) - **שוחזר הבאג בדיוק**:
//     קורה ספציפית כש-<main> נגלל **עד הסוף הגמור** (מצב שכיח במובייל,
//     עמוד מוצר לא ארוך במיוחד) - ברגע שאין יותר "מרחב הידבקות" בתוך
//     <main>, הדפדפן מוותר על ה-sticky ומחזיר את האלמנט למיקומו הסטטי
//     בזרימה, אבל עדיין "מנסה" להחיל bottom לא-אפס - האלמנט נוחת בתוך
//     תוכן העמוד (חופף ל-Materials וכו').
//   - `transform:translateY()` במקום `bottom` (אופציה שנשקלה כתיקון
//     "בטוח יותר") - **נכשל באותו אופן בדיוק** באותו מקרה-קצה (transform
//     לא מציל - ברגע שה-sticky בכלל ויתר על ה"תקיעה", גם transform מוחל
//     על המיקום הסטטי השגוי).
//   - `position:fixed` עם `bottom` דינמי - **עבד נכון בכל מצבי גלילה**,
//     כולל גלילה עד הסוף הגמור (fixed לא תלוי ב"מרחב הידבקות" של שום
//     קונטיינר - קואורדינטת viewport ליניארית פשוטה).
//
// **הפתרון שאומת ונבחר**: הפס עבר מ-`position:sticky` ל-`position:fixed`
// (בדיוק כמו ConsentBanner.tsx/ToastHost.tsx). המחיר: `fixed` לא "נעצר
// מבנית" לפני הפוטר כמו ש-`sticky` היה (זו הסיבה שהמנגנון המקורי נבחר
// מלכתחילה) - הפוטר עצמו **תמיד גלוי על המסך** (app-shell, ראו למעלה),
// אז אי אפשר "לחכות שהוא ייכנס לתצוגה" כמו בעמוד רגיל - במקום זה, הגובה
// **בפועל** של הפוטר נמדד (`ResizeObserver` על `#site-footer`, אותה
// מוסכמה בדיוק כמו `bannerHeightPx` ב-consentStore.ts) והפס תמיד נערם
// בדיוק מעליו כשאין באנר - אותה תוצאה סופית כמו קודם (לא מכסה את
// הפוטר), רק ממומשת מפורשות במקום מבנית. זה גם פותר את ה"קו הדק" (1px
// hairline gap) שאורן דיווח עליו בין תחתית הפס לראש הפוטר בחלק ממסכי
// המובייל - תופעת-לוואי קלאסית של `position:sticky` (עיגול תת-פיקסל
// שונה בין חישוב ה-sticky offset לחישוב ה-flow הרגיל של הפוטר) - ב-
// `fixed` עם מדידה מפורשת אין יותר שני חישובים נפרדים שצריכים להתאים
// בדיוק לפיקסל.
//
// אין אנימציית הופעה/היעלמות (הבריף מתיר במפורש: "אנימציה עדינה בלבד, או
// בלי") - נשמר mount/unmount מלא לפי `visible`, לא CSS transition.
import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { formatAgorot } from "@/lib/money";
import { buildSelectionLabel, getStartingPriceAgorot } from "@/lib/variant";
import { useConsentStore } from "@/stores/consentStore";
import type { Product } from "@/types/product";
import type { useVariantSelection } from "@/hooks/useVariantSelection";

interface StickyAddToBagBarProps {
  product: Product;
  selection: ReturnType<typeof useVariantSelection>;
  anchorRef: RefObject<HTMLElement | null>;
  formId: string;
  outOfStock: boolean;
}

export function StickyAddToBagBar({ product, selection, anchorRef, formId, outOfStock }: StickyAddToBagBarProps) {
  const { t } = useTranslation();
  const [pastAnchor, setPastAnchor] = useState(false);
  // תוקן 2026-09-22 (ניסיון 3, ראו הערת הקובץ למעלה): נמדד ישירות כאן
  // (לא ב-store משותף כמו הבאנר) - רק הרכיב הזה צריך את זה, אין צרכן
  // שני. אותה מוסכמה בדיוק כמו המדידה ב-ConsentBanner.tsx (ResizeObserver
  // על ה-DOM node עצמו, לא מספר קבוע-מראש - הפוטר זהה בכל עמוד, אבל
  // הגובה שלו יכול להשתנות בין עברית/אנגלית).
  const [footerHeightPx, setFooterHeightPx] = useState(0);
  const consentBannerVisible = useConsentStore((s) => s.visible);
  const consentBannerHeightPx = useConsentStore((s) => s.bannerHeightPx);

  useEffect(() => {
    const anchor = anchorRef.current;
    const root = document.getElementById("main");
    if (!anchor || !root) return;
    // תוקן 2026-09-22 (שגיאת build של אורן - `tsc -b`): עם
    // `noUncheckedIndexedAccess` (tsconfig.app.json) גם דה-סטרקצ'ור ממערך
    // (לא רק אינדקס מפורש `entries[0]`) מוקלד `T | undefined` - `entry`
    // תיאורטית יכול להיות undefined מבחינת הטיפוסים, אף ש-`observer.observe(anchor)`
    // למטה תמיד קורא ל-callback עם entries שמכיל בדיוק את ה-target הנצפה
    // היחיד. תוסף guard מפורש במקום non-null assertion (`entry!`) - עקבי
    // עם הכוונה מאחורי הדגל הזה (בטיחות טיפוסים אמיתית, לא רק השתקתה).
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setPastAnchor(!entry.isIntersecting);
    }, { root, threshold: 0 });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

  // תוקן 2026-09-22 (ניסיון 3, ראו הערת הקובץ למעלה): מודד את הפוטר
  // (`#site-footer`, ראו id חדש ב-Footer.tsx) כדי שהפס ה-fixed יידע כמה
  // "לפנות" לו במקום להסתמך על עצירה מבנית כמו ב-sticky.
  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    const measure = () => setFooterHeightPx(footer.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!pastAnchor) return null;

  const { variant, selection: axisSelection, sizeAxis } = selection;
  const priceAgorot = variant?.priceAgorot ?? getStartingPriceAgorot(product.variants);
  // "Men's · Light · L" - אותה buildSelectionLabel בדיוק שכבר משמשת את
  // ה-toast/CartItem.selectionLabel (lib/variant.ts) - לא הרכבה חדשה.
  // כשלא נבחרה מידה: t("variant.selectSize") ("Select size"), אותו מפתח
  // i18n שכבר משמש כ-placeholder בבורר המידה עצמו (הבריף, סעיף 2).
  const sizeMissing = Boolean(sizeAxis) && !axisSelection.size;
  const selectionLabel = sizeMissing ? t("variant.selectSize") : buildSelectionLabel(product.axes, axisSelection);
  // תוקן 2026-09-22 (ניסיון 3): `bottom` דינמי - "נערם" מעל הבאנר כשהוא
  // מוצג, אחרת מעל הפוטר (שתמיד גלוי - app-shell, ראו הערת הקובץ למעלה).
  // אומת בדפדפן חי נגד dull.onrender.com עצמו, לא רק נימוקית.
  const bottomOffsetPx = consentBannerVisible ? consentBannerHeightPx : footerHeightPx;
  // safe-area-inset-bottom (חריץ/פס-בית בטלפון) רלוונטי רק כשהפס נוגע
  // ממש בקצה הפיזי של המסך - וזה כבר לא קורה יותר בכלל (הוא תמיד נערם
  // מעל הבאנר או מעל הפוטר, ששניהם כבר מוסיפים לעצמם את אותו safe-area).
  // הוסר לגמרי כאן - כפילות, לא רק תלוי-מצב.

  return (
    <div
      className="fixed inset-x-0 z-10 flex items-center justify-between gap-sm border-t border-border-base bg-surface-base px-md py-sm desktop:hidden"
      style={{
        bottom: `${bottomOffsetPx}px`,
      }}
    >
      <div className="flex min-w-0 flex-col">
        {priceAgorot != null && <span className="text-body-strong font-bold text-text-base">{formatAgorot(priceAgorot)}</span>}
        <span className="truncate text-caption text-text-muted">{selectionLabel}</span>
      </div>
      {/* min-h-11 (44px) - שטח מגע מינימלי (הבריף, סעיף 2). type="submit"
          form={formId} - ראו הערת הקובץ למעלה: אותו handler בדיוק. */}
      <Button
        type="submit"
        form={formId}
        data-source="sticky_bar"
        disabled={outOfStock}
        className="w-auto! min-h-11 flex-none px-lg"
      >
        {t("actions.addToBag")}
      </Button>
    </div>
  );
}
