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
                {item.to ? (
                  <Link to={item.to} className="inline-block px-xs py-xs hover:text-text-base">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? undefined : "inline-block px-xs py-xs"}>{item.label}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
