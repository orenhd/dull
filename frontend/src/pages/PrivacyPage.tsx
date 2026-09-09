// Privacy Policy (docs/SCREENS_INVENTORY.md מסך 16) - עמוד ציבורי, בלי auth.
// נדרש כתנאי סף ל-Publish של Google OAuth consent screen בקונסולה (מגבלת
// 100 test users נוכחית לא מספיקה לפרודקשן אמיתי) - לא יוזמה עצמאית של
// המוצר, אלא דרישה טכנית חיצונית. תוכן: לא מסמך משפטי מחייב (זה פרויקט
// לימודי/פורטפוליו) אבל אמיתי וסביר - מתאר בדיוק את מה שהאתר עושה בפועל
// (Google Sign-In, עוגיית session יחידה, checkout מדומה) ולא יותר מזה,
// כי Google בודקת התאמה בין המדיניות למימוש בפועל בזמן ה-review.
// אין children/Trans כאן - לא נדרש, כל התוכן טקסט רגיל + אינטרפולציה
// פשוטה (CONTACT_EMAIL).
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { CONTACT_EMAIL } from "@/constants";

// body יכול להיות כמה פסקאות (למשל dataCollected: account + orders, שני
// משפטים נפרדים לקריאות) - לא רק מקטע-משפט-יחיד כמו ברוב הסעיפים האחרים.
function Section({ title, body }: { title: string; body: string | string[] }) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return (
    <div className="flex flex-col gap-xs">
      <h2 className="m-0 text-body-strong font-bold text-text-base">{title}</h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="m-0 text-body text-text-base">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-lg px-md py-lg">
      {/* disclaimer.backLink משותף (לא כפול) - "← Back" גנרי לבית, ראו
          DisclaimerPage.tsx שכבר משתמש באותו מפתח לאותה מטרה. */}
      <Link to="/" className="self-start px-xs py-xs text-caption text-text-muted underline hover:text-text-base">
        {t("disclaimer.backLink")}
      </Link>

      <div className="flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <h1 className="m-0 font-headline text-h2 font-black text-text-base">{t("privacy.title")}</h1>
          <span className="text-caption text-text-muted">{t("privacy.lastUpdated")}</span>
        </div>
        <p className="m-0 text-body text-text-base">{t("privacy.intro")}</p>

        <Section
          title={t("privacy.dataCollected.title")}
          body={[t("privacy.dataCollected.account"), t("privacy.dataCollected.orders")]}
        />
        <Section title={t("privacy.thirdPartySignIn.title")} body={t("privacy.thirdPartySignIn.body")} />
        <Section title={t("privacy.cookies.title")} body={t("privacy.cookies.body")} />
        <Section title={t("privacy.payments.title")} body={t("privacy.payments.body")} />
        <Section title={t("privacy.howWeUse.title")} body={t("privacy.howWeUse.body")} />
        <Section title={t("privacy.dataSharing.title")} body={t("privacy.dataSharing.body")} />
        <Section title={t("privacy.contact.title")} body={t("privacy.contact.body", { email: CONTACT_EMAIL })} />
        <Section title={t("privacy.changes.title")} body={t("privacy.changes.body")} />
      </div>
    </div>
  );
}
