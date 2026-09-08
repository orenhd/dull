// MVP capability 3 (docs/PRD.md סעיף 5) - פסקת חומרים וייצור. שדה יחיד
// (`description`) מגיע מה-API - הדמו הציג גם משפט caption נוסף ("Knitted
// and printed in small batches...") שאין לו שדה מקביל ב-DB (backend/prisma/
// schema.prisma Product יש רק description Json? יחיד); לא הומצא, פשוט הושמט.
import { useTranslation } from "react-i18next";

export function MaterialsCard({ description }: { description: string | null }) {
  const { t } = useTranslation();
  if (!description) return null;

  return (
    <div className="flex flex-col gap-sm rounded-md border border-border-base bg-surface-base p-lg">
      <h2 className="font-headline text-h3 font-black text-text-base">{t("materials.title")}</h2>
      <p className="m-0 text-body text-text-base">{description}</p>
    </div>
  );
}
