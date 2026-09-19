// גלריה כפולה - צילום על הגוף + צילום המוצר על אפור, שניהם גלויים תמיד
// בו-זמנית (לא swipe). ראו docs/PRD.md סעיף 8א לנימוק המלא: הפרסונה
// הראשית (יובל שגיא) לא מבצעת פעולת-ניווט נוספת כדי לוודא מוצר.
//
// אין כיתובים מתחת לדימויים (הוסר בכוונה, 2026-09-08) - alt text עדיין
// מתאר כל תמונה במלואו לצורכי נגישות, רק לא מוצג ויזואלית.
//
// תוקן 2026-09-19 (Marketing feedback - PDP buy box A1): במובייל הזוג
// הזה כבר לא מוצג יחד - הוא מתפצל סביב ה-buy box (image1 מעל, image2
// מתחת לכפתור Add to Bag), כדי שהכפתור ייכנס ל-~1.3 מסכים במקום 2.6.
// הרכיב הזה עצמו הפך ל-**דסקטופ-בלבד** (hidden כברירת מחדל, desktop:grid) -
// שני העותקים המובייליים נבנים מ-GalleryShot (מיוצא עכשיו) ישירות
// ב-ProductPage.tsx, במיקומים הנכונים בזרימת ה-DOM. שתי התמונות עדיין
// "תמיד גלויות" (החלטת PRD, ראו למעלה) - רק במקום-אחר, לא הוסרו.
import { useEffect } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { findMedia } from "@/lib/variant";
import { useCrossfadeImage } from "@/hooks/useCrossfadeImage";
import { MEDIA_ROLE } from "@/constants";
import type { Media } from "@/types/product";

interface ProductGalleryProps {
  media: Media[];
  selectedIds: ReadonlySet<string>;
  dimmed?: boolean; // מצב "אזל מהמלאי" - התמונות מוצגות מעומעמות/גרייסקייל
}

export function GalleryShot({
  url,
  alt,
  dimmed,
  mobileAspectClassName,
}: {
  url: string;
  alt: string;
  dimmed?: boolean;
  // אספקט המובייל בלבד פרמטרי (בקשת Oren, 2026-09-08): צילום הדוגמנות
  // מוצג ריבועי מלא במובייל בלי חיתוך, צילום ה-flat ממשיך עם חיתוך 5:4
  // כמו קודם. בדסקטופ שני הדימויים ממשיכים עם 4:5 הקיים - לא התבקש שינוי שם.
  mobileAspectClassName: string;
}) {
  const { displaySrc, isSwapping } = useCrossfadeImage(url);

  return (
    <img
      src={displaySrc}
      alt={alt}
      width={1200}
      height={1200}
      loading="eager"
      className={`${mobileAspectClassName} w-full rounded-sm bg-surface-sunken object-cover transition-opacity duration-(--motion-duration-base) ease-standard desktop:aspect-[4/5]`}
      style={{
        opacity: isSwapping ? 0 : dimmed ? 0.65 : 1,
        filter: dimmed ? "grayscale(1)" : undefined,
      }}
    />
  );
}

export function ProductGallery({ media, selectedIds, dimmed }: ProductGalleryProps) {
  const modelShot = findMedia(media, MEDIA_ROLE.campaign, selectedIds);
  const productShot = findMedia(media, MEDIA_ROLE.flat, selectedIds);

  // מחממים cache לכל תמונות FLAT/CAMPAIGN של המוצר - כך שהחלפת וריאנט
  // (fit/colorway) לא ממתינה לרשת, מקביל ל"warm the cache" בדמו/script.js.
  useEffect(() => {
    const urls = media
      .filter((m) => m.role === MEDIA_ROLE.flat || m.role === MEDIA_ROLE.campaign)
      .map((m) => resolveMediaUrl(m.url));
    const preloaded = urls.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
    return () => {
      preloaded.forEach((img) => {
        img.src = "";
      });
    };
  }, [media]);

  return (
    <div className="hidden w-full min-w-0 items-start gap-md desktop:grid desktop:grid-cols-2 desktop:flex-none desktop:basis-[620px]">
      {modelShot && (
        <GalleryShot
          url={resolveMediaUrl(modelShot.url)}
          alt={modelShot.altText ?? ""}
          dimmed={dimmed}
          mobileAspectClassName="aspect-square"
        />
      )}
      {productShot && (
        <GalleryShot
          url={resolveMediaUrl(productShot.url)}
          alt={productShot.altText ?? ""}
          dimmed={dimmed}
          mobileAspectClassName="aspect-[5/4]"
        />
      )}
    </div>
  );
}
