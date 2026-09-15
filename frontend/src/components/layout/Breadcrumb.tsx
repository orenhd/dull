import { Fragment } from "react";
import { Link } from "@tanstack/react-router";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-[1200px] px-md py-sm">
      <ol className="flex items-center gap-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              {index > 0 && (
                <li aria-hidden="true" className="text-caption text-text-muted">
                  /
                </li>
              )}
              <li className="text-caption text-text-muted" aria-current={isLast ? "page" : undefined}>
                {/* <bdi> (2026-09-15, docs/PRD.md סעיף 28) - item.label לפעמים
                    שם מוצר (product.name, מגיע מה-API, מקומי/two-way-localized
                    לפי schema.prisma - יכול באותה מידה להיות עברית או שם-להקה
                    לטיני שמתחיל בספרה, למשל "45 Grave Tee"). אומת ויזואלית
                    (Playwright) ש-li סטנדרטי בלי בידוד מפורש עדיין מציג שם
                    כזה הפוך ("Grave Tee 45") בתוך breadcrumb בעברית - בדיוק
                    אותה מחלקת-באג כמו BandCredit.tsx, למרות שזה לא interpolation
                    בתוך משפט. <bdi> (לא dir="ltr" כמו ב-BandCredit) - כי בניגוד
                    ל-bandCreditName, item.label יכול להיות עברית לגיטימית
                    (breadcrumb.home/nav.shirts) - <bdi> מזהה כיוון לפי תוכן
                    במקום לכפות LTR. no-op לתוויות שלא מתחילות בספרה. */}
                {item.to ? (
                  <Link to={item.to} className="inline-block px-xs py-xs hover:text-text-base">
                    <bdi>{item.label}</bdi>
                  </Link>
                ) : (
                  <span className={isLast ? undefined : "inline-block px-xs py-xs"}>
                    <bdi>{item.label}</bdi>
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
