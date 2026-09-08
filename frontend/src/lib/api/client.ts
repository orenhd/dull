// HTTP client דק מול ה-backend. שני כללים קשיחים (docs/API_CONTRACT.md):
//   1. credentials: 'include' בכל קריאה - אחרת ה-session cookie (httpOnly,
//      חתום) לא נשלח/מתקבל, וכל endpoint מתחת ל-/orders יחזיר 401.
//   2. base URL תמיד מ-env.ts (VITE_API_BASE_URL) - אף קריאת fetch בקוד
//      הקומפוננטות לא בונה URL בעצמה.
import { env } from "@/config/env";
import type { Locale } from "@/constants";

export class ApiError extends Error {
  constructor(
    public status: number,
    // גוף השגיאה כפי שהגיע מה-backend - למשל { error: "PRODUCT_NOT_FOUND" }.
    // שגיאות ולידציה (Zod, 400) לא מובטחות במבנה קבוע - ראו API_CONTRACT.md
    // "שגיאות כלליות" - לכן זה unknown ולא טיפוס ממותג.
    public body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  locale?: Locale;
  signal?: AbortSignal;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, env.VITE_API_BASE_URL);
  if (options.locale) {
    url.searchParams.set("locale", options.locale);
  }

  const res = await fetch(url, {
    credentials: "include",
    signal: options.signal,
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // גוף לא-JSON (או ריק) - נשאר null, ApiError.status עדיין אומר את מה שצריך.
    }
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, options),
};

// media.url מגיע מה-backend כנתיב יחסי ("/images/x.webp" - ראו backend/src/
// index.ts, express.static על "/images"), לא כ-URL מלא כפי שדוגמת
// API_CONTRACT.md מציגה. צריך לצרף ל-base URL בצד הלקוח.
export function resolveMediaUrl(url: string): string {
  return new URL(url, env.VITE_API_BASE_URL).toString();
}
