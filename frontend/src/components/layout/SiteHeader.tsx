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
import { LanguageSwitcher } from "./LanguageSwitcher";

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
function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const count = useCartStore(selectCartItemCount);

  return (
    <Link
      to="/cart"
      onClick={onNavigate}
      className="inline-block px-xs py-xs text-caption text-text-muted hover:text-text-base"
      activeProps={{ className: "text-text-base font-bold" }}
    >
      {t("cart.navLabel")}
      {count > 0 ? ` (${count})` : ""}
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

        <div className="flex items-center gap-sm">
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
            <li>
              <CartLink onNavigate={() => setMenuOpen(false)} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
