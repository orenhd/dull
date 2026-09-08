// עוטף window.matchMedia כ-hook - שימוש יחיד כרגע: SiteHeader סוגר את
// תפריט המובייל אם המסך התרחב לדסקטופ באמצע שהתפריט פתוח (מקביל ל-
// "wide.addEventListener('change', closeOnWide)" בדמו/script.js).
import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
