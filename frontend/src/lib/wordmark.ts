// class name משותף לכל מקום שבו המילה "Dull"/"DULL" מופיעה כ-wordmark של
// המותג (SiteHeader, HomePage) - תמיד Archivo Black 900 בגודל האנגלי,
// גם בתוך עמוד/כותרת בעברית. ראו ההערה ב-tokens.css ליד --typography-*-
// wordmark-* להסבר המלא.
export function wordmarkClassName(size: "h1" | "h3", className = ""): string {
  const sizeClass = size === "h1" ? "text-wordmark-h1" : "text-wordmark-h3";
  return `font-wordmark ${sizeClass} font-black tracking-[-0.02em] text-text-base ${className}`.trim();
}
