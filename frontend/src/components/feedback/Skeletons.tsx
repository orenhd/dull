// שלדי טעינה (skeletons) - כל אחד כאן מיועד להצטמצם/להתרחב *בדיוק* על אותה
// רשת (grid/flex) שהתוכן האמיתי המקביל יתפוס, כך שברגע שה-query מסתיים אין
// "קפיצת layout" (Oren, 2026-09-10: "שיישב בדיוק על אותו גריד, הן בדסקטופ
// והן במובייל"). ראו docs/PRD.md סעיף 12.17 לרשימת כל אי-ההתאמות שתוקנו כאן
// ולמה שנותר קירוב (widths, ספירת items) ולא ערך מדויק.
//
// שיטת המדידה: במקום גבהים "עגולים" משרירותיים מסולם הריווח (h-md/h-sm...),
// כל "שורת טקסט" משתמשת ב-calc() שמפנה ישירות למשתנים שטיילווינד עצמו כבר
// מייצר לכל תפקיד טיפוגרפי (text-h2--line-height וכו', ראו styles/index.css
// @theme inline) - בדיוק אותם --text-*/--text-*--line-height שה-typography
// utility class (text-h2, text-body וכו') על האלמנט האמיתי משתמש בהם. זה
// אוטומטית נכון גם ב-RTL/עברית (tokens.css מגדיר גדלים/line-heights שונים
// תחת :root[lang="he"] - ה-calc() כאן "רואה" את אותם ערכים חיים, בלי שום
// branch נפרד לפי שפה) ובלי להמציא עוד טוקן חדש - רק מרכיב מחדש טוקנים
// קיימים. box-sizing הוא border-box (Preflight) וכל האלמנטים האמיתיים כאן
// הם auto-height (לא height מפורש) - אז border שנוסף על גבי ה-calc (למשל
// במעטפת ה-accordion למטה) מתווסף באמת מעל, בדיוק כמו באלמנט האמיתי.
const LINE_H2 = "h-[calc(var(--text-h2)*var(--text-h2--line-height))]";
const LINE_H3 = "h-[calc(var(--text-h3)*var(--text-h3--line-height))]";
// LINE_BODY_STRONG/LINE_CAPTION/PULSE מיוצאים (לא רק שימוש פנימי כאן) - יש
// להם צרכן חיצוני יחיד כרגע: השלד המקומי (inline) ב-OrdersPage.tsx, לרשימת
// ההזמנות. השלד עצמו נשאר local ל-OrdersPage.tsx (מוסכמת "שלדים ספציפיים
// לעמוד נשארים local" - לא כל שלד עובר לכאן), אבל נוסחת ה-calc() עצמה
// מיוצאת במקום להיות משוכפלת כמחרוזת - כדי שלא "תדרוך" משתי נקודות אם
// הטוקנים הבסיסיים ישתנו.
export const LINE_BODY_STRONG = "h-[calc(var(--text-body-strong)*var(--text-body-strong--line-height))]";
const LINE_BODY = "h-[calc(var(--text-body)*var(--text-body--line-height))]";
export const LINE_CAPTION = "h-[calc(var(--text-caption)*var(--text-caption--line-height))]";

// "קופסה" עם ריפוד אנכי + שורת טקסט אחת בפנים (select/chip: py-sm; button/
// accordion-summary: py-md) - לא רק טקסט "עירום" כמו ה-LINE_* למעלה.
const BOX_PY_SM_BODY = "h-[calc(var(--space-sm)*2+var(--text-body)*var(--text-body--line-height))]"; // select, chip
const BOX_PY_MD_BODY_STRONG =
  "h-[calc(var(--space-md)*2+var(--text-body-strong)*var(--text-body-strong--line-height))]"; // button, accordion summary (closed)

export const PULSE = "animate-pulse-soft rounded-sm bg-surface-sunken";

export function GallerySkeleton() {
  // מעטפת זהה ל-ProductGallery.tsx (min-w-0/items-start/flex-none+basis-[620px]
  // כדי שברוחב הדסקטופ הגלריה תתפוס בדיוק את אותו רוחב-flex כמו במצב טעון,
  // לא תתכווץ/תתרחב אחרת ותזיז את עמודת התוכן לצידה). שני התאים: התמונה
  // הראשונה (צילום דוגמנות) ריבועית במובייל בפועל, לא 5:4 כמו השנייה
  // (צילום flat) - ProductGallery.tsx GalleryShot: mobileAspectClassName
  // שונה בין השתיים - היה זהה בטעות בגרסה הקודמת של השלד הזה.
  return (
    <div
      className="grid w-full min-w-0 grid-cols-1 items-start gap-md desktop:grid-cols-2 desktop:flex-none desktop:basis-[620px]"
      aria-hidden="true"
    >
      <div className={`aspect-square ${PULSE} desktop:aspect-[4/5]`} />
      <div className={`aspect-[5/4] ${PULSE} desktop:aspect-[4/5]`} />
    </div>
  );
}

// שלד עמודת התוכן של עמוד הפריט - מראה בדיוק את מבנה ה-DOM של
// ProductPageContent + AddToBagForm.tsx (שתי רמות gap: gap-lg בין בלוק
// הכותרת ל-AddToBagForm, gap-sm/gap-md בפנים) ולא רשימת בארים שטוחה.
// שונה מ-OrderDetailSkeleton למטה בכוונה - השימוש הקודם (ContentSkeleton
// גנרי אחד לשניהם) היה אי-ההתאמה הכי בעייתית שנמצאה (docs/PRD.md 12.17):
// צורות תוכן שונות לגמרי לא יכולות לחלוק שלד אחד ולהתיישר על אותה רשת.
// מחזירה Fragment בכוונה, לא <div> עטיפה משלה - הקורא היחיד (ProductPage.tsx)
// כבר שם על עמודת-התוכן שלו className זהה ב-2 ביט (min-w-0/desktop:flex-1/
// desktop:basis-[400px], בדיוק כמו ProductPageContent האמיתי) - div-עטיפה
// נוספת כאן הייתה רק קינון מיותר בלי תועלת.
export function ProductContentSkeleton() {
  return (
    <>
      {/* כותרת + מחיר + קרדיט להקה - ProductPageContent.tsx, gap-sm */}
      <div className="flex flex-col gap-sm">
        <span className={`block w-[70%] ${LINE_H2} ${PULSE}`} />
        <span className={`block w-[30%] ${LINE_BODY_STRONG} ${PULSE}`} />
        <div className="flex flex-col gap-xs">
          <span className={`block w-[55%] ${LINE_CAPTION} ${PULSE}`} />
          <span className={`block w-[75%] ${LINE_CAPTION} ${PULSE}`} />
        </div>
      </div>

      {/* AddToBagForm.tsx - form עצמו הוא flex-col gap-md, כל הפריטים למטה
          הם ילדים ישירים שלו באותה רמה (לא עוד קינון). */}
      <div className="flex flex-col gap-md">
        {/* שני צירים לא-מידה (Fit/Colorway) - תמיד בדיוק 2 ערכים בכל אחד
            במודל הנתונים הנוכחי (נשים/גברים, בהיר/כהה - docs/PRD.md סעיף
            5). אם ייווסף ציר שלישי/ערך שלישי בעתיד, לעדכן גם כאן. */}
        <div className="flex flex-col gap-sm">
          <span className={`block w-16 ${LINE_CAPTION} ${PULSE}`} />
          <div className="flex flex-wrap gap-sm">
            <span className={`w-20 ${BOX_PY_SM_BODY} ${PULSE}`} />
            <span className={`w-16 ${BOX_PY_SM_BODY} ${PULSE}`} />
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <span className={`block w-20 ${LINE_CAPTION} ${PULSE}`} />
          <div className="flex flex-wrap gap-sm">
            <span className={`w-16 ${BOX_PY_SM_BODY} ${PULSE}`} />
            <span className={`w-16 ${BOX_PY_SM_BODY} ${PULSE}`} />
          </div>
        </div>

        {/* בורר מידה - VariantSelector.tsx: label (mb-sm) + select. */}
        <div className="flex flex-col gap-sm">
          <span className={`block w-12 ${LINE_BODY} ${PULSE}`} />
          <span className={`w-full ${BOX_PY_SM_BODY} ${PULSE}`} />
        </div>

        {/* SizeGuideAccordion.tsx במצב סגור (ברירת המחדל) - <details> בלי
            open, אז הגובה האמיתי הראשוני הוא רק שורת ה-summary (p-md,
            text-body-strong) - בדיוק אותה נוסחה כמו הכפתור למטה, ולכן אותו
            טוקן BOX_PY_MD_BODY_STRONG. עם border/rounded-md כמו הקומפוננטה
            האמיתית - זה "כרטיס" של ממש, לא רק שורת טקסט. */}
        <span className={`w-full rounded-md border border-border-base ${BOX_PY_MD_BODY_STRONG} ${PULSE}`} />

        {/* MaterialsCard.tsx - מעטפת הכרטיס (border/rounded-md/p-lg/bg-surface-base)
            זהה בוודאות לאמיתית; התוכן בפנים (כותרת h3 + פסקת description)
            הוא קירוב בלבד - אורך ה-description משתנה בין מוצרים ומגיע רק
            אחרי שהנתונים חוזרים, אי אפשר לדעת אותו מראש. שתי שורות טקסט
            הן ניחוש סביר (רוב התיאורים הקיימים כיום קצרים), לא הבטחה. */}
        <div className="flex flex-col gap-sm rounded-md border border-border-base bg-surface-base p-lg">
          <span className={`block w-[45%] ${LINE_H3} ${PULSE}`} />
          <div className="flex flex-col gap-xs">
            <span className={`block ${LINE_BODY} ${PULSE}`} />
            <span className={`block w-[80%] ${LINE_BODY} ${PULSE}`} />
          </div>
        </div>

        {/* כפתור "Add to Bag" - Button.tsx BASE: py-md + text-body-strong,
            אותה נוסחה בדיוק כמו ה-accordion למעלה. */}
        <span className={`w-full rounded-sm ${BOX_PY_MD_BODY_STRONG} ${PULSE}`} />
      </div>
    </>
  );
}

// שלד רשת קטלוג (HomePage/CollectionPage) - אותה רשת 2/4 עמודות כמו
// ProductGrid.tsx, וגבהי שורות הטקסט מתואמים בדיוק לתפקיד הטיפוגרפי
// האמיתי בכל שורה ב-ProductCard.tsx (היה h-md/h-sm גנרי - לא תאם את
// גובה-השורה האמיתי של text-body/text-caption, ראו docs/PRD.md 12.17).
export function CatalogGridSkeleton() {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-md p-0 desktop:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex flex-col gap-xs">
          <div className={`aspect-square ${PULSE}`} />
          <span className={`block w-[80%] ${LINE_BODY} ${PULSE}`} />
          <span className={`block w-[40%] ${LINE_CAPTION} ${PULSE}`} />
        </li>
      ))}
    </ul>
  );
}

// שלד פירוט הזמנה (OrderDetailPage.tsx) - קודם השתמש ב-ContentSkeleton
// המשותף עם עמוד הפריט, שהוא צורה שונה לגמרי (form עם chips/select, לא
// רשימת פריטים+תמונות+סיכום) - ראו docs/PRD.md 12.17. ממפה את
// OrderDetailContent בדיוק: בלוק כותרת (gap-xs), בלוק פריטים (gap-sm) עם
// שורות פריט (thumbnail+שם+תווית-בחירה+מחיר, בדיוק כמו OrderItemRow), שורת
// סה"כ, ובלוק משלוח. מספר שורות הפריטים (2) ונוכחות בלוק המשלוח הם קירוב -
// לא ידועים מראש לפני שההזמנה בפועל חוזרת מהשרת.
export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-lg px-md py-lg" aria-hidden="true">
      <div className="flex flex-col gap-xs">
        <span className={`block w-24 ${LINE_CAPTION} ${PULSE}`} />
        <span className={`block w-[45%] ${LINE_H3} ${PULSE}`} />
        <span className={`block w-[35%] ${LINE_CAPTION} ${PULSE}`} />
        <span className={`block w-20 ${LINE_CAPTION} ${PULSE}`} />
      </div>

      <div className="flex flex-col gap-sm">
        <span className={`block w-16 ${LINE_BODY_STRONG} ${PULSE}`} />
        <ul className="m-0 flex list-none flex-col gap-xs p-0">
          {Array.from({ length: 2 }, (_, i) => (
            <li key={i} className="flex items-center gap-sm border-b border-border-base py-xs">
              <div className={`size-16 flex-none rounded-sm ${PULSE}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-xs">
                <span className={`block w-[70%] ${LINE_BODY} ${PULSE}`} />
                <span className={`block w-[40%] ${LINE_CAPTION} ${PULSE}`} />
              </div>
              <span className={`w-12 flex-none ${LINE_BODY} ${PULSE}`} />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <span className={`w-12 ${LINE_BODY_STRONG} ${PULSE}`} />
          <span className={`w-16 ${LINE_BODY_STRONG} ${PULSE}`} />
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <span className={`block w-24 ${LINE_BODY_STRONG} ${PULSE}`} />
        <span className={`block w-[85%] ${LINE_BODY} ${PULSE}`} />
      </div>
    </div>
  );
}
