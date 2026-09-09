// כפתור "Sign in with Google" - Google Identity Services (GIS), טעון כ-
// <script> גלובלי ב-index.html (לא npm package - כך ממליצה גוגל, ראו
// developers.google.com/identity/gsi/web). הרינדור/עיצוב של הכפתור עצמו
// בבעלות גוגל (iframe פנימי) - לא ניתן להלביש עליו tokens.css/Tailwind,
// זו מגבלה ידועה של GIS. עוטפים כאן רק את ה-container וה-loading/error
// state סביבו.
//
// טקסט ההסכמה מתחת לכפתור (authConsent.text, docs/SCREENS_INVENTORY.md
// מסך 16) נדרש כתנאי ל-Publish של Google OAuth consent screen בקונסולה -
// ממוקם כאן בקומפוננטה המשותפת (לא בכל מסך שמציג את הכפתור בנפרד) כדי
// שיופיע אוטומטית בכל מקום שבו GoogleSignInButton מוצג (checkout,
// היסטוריית הזמנות) בלי כפילות.
import { useEffect, useRef, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { env } from "@/config/env";
import { loginWithGoogle } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useApiLocale } from "@/hooks/useApiLocale";

// טיפוס מינימלי ל-window.google - רק החלק שבאמת בשימוש כאן. אין חבילת
// @types רשמית ל-GIS, אז מוצהר ידנית במקום any גורף.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; shape?: string; locale?: string },
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const { t } = useTranslation();
  const locale = useApiLocale();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useToastStore((s) => s.show);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(() => Boolean(window.google?.accounts?.id));

  // ה-script (index.html) טעון עם async - יכול עדיין לא להיות מוכן ברגע
  // שהקומפוננטה מתעצבת (למשל ניווט מהיר ל-/checkout מיד אחרי טעינת הדף).
  // polling קצר במקום תלות ב-onload event, שקשה "לתפוס" מקומפוננטת React
  // שלא היא זו שהוסיפה את התג ל-<head>.
  useEffect(() => {
    if (scriptReady) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google) return;

    async function handleCredentialResponse(response: { credential: string }) {
      try {
        const { user } = await loginWithGoogle(response.credential);
        setUser(user);
      } catch {
        showToast(t("auth.signInError"));
      }
    }

    window.google.accounts.id.initialize({
      client_id: env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });
    // מרוקן לפני רינדור חוזר (למשל בעקבות החלפת שפה - locale ב-deps מטה) -
    // GIS לא מחליף כפתור קיים לבד, רק מוסיף עוד אחד לתוך ה-container.
    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      locale,
    });
  }, [scriptReady, locale, setUser, showToast, t]);

  return (
    <div className="flex flex-col items-center gap-xs">
      <div ref={containerRef} className="flex justify-center" aria-live="polite" />
      {/* בלי children (אותו לקח מ-BandCredit.tsx, docs/PRD.md סעיף 12.11) -
          components בלבד, בלי values (שני התגים סטטיים, אין אינטרפולציה). */}
      <p className="m-0 max-w-[280px] text-center text-caption text-text-muted">
        <Trans
          i18nKey="authConsent.text"
          components={{
            terms: <Link to="/terms" className="underline hover:text-text-base" />,
            privacy: <Link to="/privacy" className="underline hover:text-text-base" />,
          }}
        />
      </p>
    </div>
  );
}
