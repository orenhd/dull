// מקביל למבנה ה-header בדמו (dull-demo/index.html): wordmark + ניווט מלא
// בדסקטופ, hamburger במובייל. פריטי ניווט שאין להם עדיין עמוד אמיתי (הכל
// חוץ מ-Home) מוצגים לא-פעילים בכוונה, במקום href="#" מת - ראו TECH_SPEC.md
// סעיף 5 (עמוד הפריט הוא הראשון, השאר בתור).
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { wordmarkClassName } from "@/lib/wordmark";
import { useCartStore, selectCartItemCount } from "@/stores/cartStore";
import { BasketIcon } from "./BasketIcon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";

interface NavItem {
  key: "home" | "shirts" | "footwear" | "about";
  to?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", to: "/" },
  { key: "shirts", to: "/shirts" },
  { key: "about", to: "/about" },
  { key: "footwear", to: "/footwear" },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const label = t(`nav.${item.key}`);

  if (item.to) {
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        className="inline-block px-xs py-xs text-caption text-text-muted hover:text-text-base desktop:px-xs"
        activeProps={{ className: "text-text-base font-bold" }}
      >
        {label}
      </Link>
    );
  }

  return (
    <span
      aria-disabled="true"
      title={t("nav.comingSoon")}
      className="inline-block cursor-not-allowed px-xs py-xs text-caption text-text-muted/50"
    >
      {label}
    </span>
  );
}

// לינק לעגלה - לא NavItem "רגיל" (אין לו מפתח סטטי ב-nav.*, יש לו ספרת
// פריטים חיה מה-store) אז קומפוננטה נפרדת, לא חלק מ-NAV_ITEMS/NavLink.
// אותה מיקום שהיה שייך פעם ל-Wishlist (הוסר, 2026-09-08) - בקבוצת הסוף
// לצד ה-LanguageSwitcher בדסקטופ, ובתפריט המובייל.
//
// תוקן 2026-09-23 (PRD.md סעיף 55, בקשת אורן [ג]) - הכותרת הטקסטואלית
// "Bag"/"סל" הוחלפה באייקון (BasketIcon.tsx) + באדג' עם המספר. הטקסט לא
// נעלם - עבר ל-sr-only (אותה מוסכמה בדיוק כמו כפתור ההמבורגר למעלה),
// כדי שקורא-מסך עדיין ישמע "Bag (4)" בדיוק כמו קודם. הבאדג' עצמו
// aria-hidden כדי לא לשכפל את המספר בהכרזה.
//
// צבע הבאדג': גרסה ראשונה (2026-09-23, PRD §55) מילאה את --color-brand-
// primary-light (בקשת אורן המקורית) + border, כי המילוי הבהיר לבדו נכשל
// בניגודיות (2.77:1 מול רקע לבן, מתחת ל-3:1 הנדרש ל-WCAG 1.4.11). אורן ביקש
// (2026-09-23, PRD §57) להיפטר מה-border - "מכביד". נבדקו שתי החלופות שהוא
// הציע: צהוב-לימון/צהוב-שמש (--color-accent-lemon/--color-accent-sun) נכשלים
// אפילו יותר גרוע (1.13:1/1.31:1 - בהירים מדי, קרובים ללבן) ומספר לבן על
// המילוי הבהיר גם נכשל (2.77:1, צריך 4.5:1) - אף אחת מהחלופות לא פתרה את
// הבעיה בלי border. הפתרון שנבחר (אושר ע"י אורן): במקום להבהיר עוד, הוחלף
// המילוי לכחול-הנייבי הכהה --color-brand-primary (הצבע העיקרי של המותג) עם
// מספר בלבן (--color-surface-base, לא Tailwind text-white גולמי - אותה
// מוסכמת "רק טוקנים" כמו בכל הקובץ) - ניגודיות 14.2:1 גם מול הרקע (1.4.11)
// וגם לטקסט (1.4.3), בלי צורך ב-border בכלל.
//
// אנימציית הנענוע (ראו --animate-basket-swing, index.css): מופעלת פעם
// אחת בכל הוספה מוצלחת לסל (עלייה במספר, לא בכל שינוי - למשל לא בהסרה
// בעמוד הסל). `key={swingTrigger}` מכריח remount של ה-span העוטף בכל
// טריגר, כדי שהאנימציה תתחיל תמיד מחדש בבירור גם בהוספות מהירות
// עוקבות - לא תלוי ב-onAnimationEnd (יציב יותר, לא "נתקע" אם אירוע
// לא יורה מסיבה כלשהי).
function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const count = useCartStore(selectCartItemCount);
  const previousCountRef = useRef(count);
  const [swingTrigger, setSwingTrigger] = useState(0);

  useEffect(() => {
    if (count > previousCountRef.current) {
      setSwingTrigger((current) => current + 1);
    }
    previousCountRef.current = count;
  }, [count]);

  return (
    <Link
      to="/cart"
      onClick={onNavigate}
      className="relative inline-flex items-center justify-center p-xs text-text-muted hover:text-text-base"
      activeProps={{ className: "text-text-base" }}
    >
      <span
        key={swingTrigger}
        className={`inline-block origin-top ${swingTrigger > 0 ? "animate-basket-swing" : ""}`}
      >
        <BasketIcon className="size-6" />
      </span>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-[3px] text-[10px] leading-none font-bold text-surface-base"
        >
          {count}
        </span>
      )}
      <span className="sr-only">
        {t("cart.navLabel")}
        {count > 0 ? ` (${count})` : ""}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery("(min-width: 900px)");

  // לחזור למצב סגור אם המסך התרחב לדסקטופ בזמן שהתפריט פתוח - מקביל ל-
  // "wide.addEventListener('change', closeOnWide)" בדמו/script.js.
  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="shrink-0 px-md pb-sm pt-lg">
      <div className="mx-auto flex max-w-[1200px] min-w-0 items-center justify-between">
        {/* המבורגר + wordmark צמודים זה לזה בקבוצה אחת (בקשת Oren,
            2026-09-08) - במובייל זה שם אותם דבוקים בקצה ה-start, בדסקטופ
            הכפתור נעלם (desktop:hidden) והקבוצה מתכווצת לוורדמארק לבד -
            אותה תוצאה חזותית שהייתה קודם. */}
        <div className="flex items-center gap-sm">
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="-ms-sm flex size-10 items-center justify-center rounded-sm desktop:hidden"
          >
            <span className="relative block h-0.5 w-5 bg-text-base transition-transform duration-[120ms] ease-standard">
              <span
                className="absolute start-0 block h-0.5 w-5 bg-text-base transition-transform duration-[120ms] ease-standard"
                style={{ top: menuOpen ? 0 : -6, transform: menuOpen ? "rotate(45deg)" : "none" }}
              />
              <span
                className="absolute start-0 block h-0.5 w-5 bg-text-base transition-transform duration-[120ms] ease-standard"
                style={{ top: menuOpen ? 0 : 6, transform: menuOpen ? "rotate(-45deg)" : "none" }}
              />
            </span>
            <span className="sr-only">{t("common.menu")}</span>
          </button>

          <Link to="/" className={wordmarkClassName("h3")}>
            DULL
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden desktop:block">
          <ul className="flex gap-md">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>
        </nav>

        {/* UserMenu ("שלום, {שם}" + תפריט הזמנות/התנתקות, docs/PRD.md סעיף
            12.15) מוצג רק כשיש משתמש מחובר - מחליף את OrdersLink העצמאי
            שהיה כאן, בלי להוסיף עוד פריט לקבוצה. */}
        <div className="flex items-center gap-sm">
          <UserMenu />
          <CartLink />
          <LanguageSwitcher />
        </div>
      </div>

      {!isDesktop && menuOpen && (
        <nav id="mobile-menu" aria-label="Primary" className="mt-sm border-t border-border-base px-md">
          <ul className="mx-auto max-w-[1200px]">
            {NAV_ITEMS.map((item) => (
              <li key={item.key} className="border-b border-border-base">
                <NavLink item={item} onNavigate={() => setMenuOpen(false)} />
              </li>
            ))}
            {/* בלי כניסת OrdersLink כפולה כאן - UserMenu (למעלה בשורת הheader
                העליונה, לא בתוך הדיסקלוז הזה) כבר גלוי גם במובייל ומכיל את
                קישור ההזמנות בתוך התפריט שלו.

                תוקן 2026-09-23 (PRD.md סעיף 57, דיווח אורן): הוסרה כאן גם
                הכניסה הכפולה של CartLink (הייתה עד כה, לצד NAV_ITEMS, בנפרד
                מהמופע בשורת ה-header העליונה). הסיבה לא הייתה רק "כפילות
                נחמדה-להסיר" - היא הייתה גם באג ויזואלי אמיתי: CartLink בנוי
                כ-inline-flex עוטף אייקון+באדג' עם מיקום מוחלט (`absolute
                -end-1 -top-1`), בזמן שה-<li> כאן מעוצב לשורת ניווט טקסטואלית
                פשוטה (NavLink, inline-block+padding) - שילוב שגרם לבאדג'
                לחרוג/להיראות "לא במקום" בתוך התפריט. מכיוון שקבוצת ה-header
                העליונה (UserMenu/CartLink/LanguageSwitcher, למעלה בקומפוננטה)
                כבר *תמיד* גלויה - גם במובייל, בלי שום `hidden`/`desktop:`
                מותנה - הסל כבר נגיש משם בכל רוחב מסך; אין צורך במופע נוסף
                כאן, וההסרה גם פותרת את הבאג מבלי לנסות "לתקן" את המיקום
                המוחלט של הבאדג' בתוך הקשר-עיצוב שלא מתאים לו. */}
          </ul>
        </nav>
      )}
    </header>
  );
}
