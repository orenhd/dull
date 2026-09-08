// ממפה סיומת קובץ ל-MIME type, לצורך שדה contentType בצירופי מייל (ראו
// הערה ב-email.ts - Resend/Gmail לא מרנדרים תמונת CID inline נכון בלעדיו).
// לא ספרייה כללית - רק הסיומות שבפועל קיימות ב-public/images (ראו
// scripts/generate-web-images.ts, שממיר הכל ל-webp).
const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export function extensionToMimeType(filename: string): string | undefined {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return EXTENSION_TO_MIME_TYPE[ext];
}
