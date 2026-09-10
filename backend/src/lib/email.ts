// שליחת מייל התודה ההומוריסטי אחרי הזמנה, עם ה"מתנה" (PDF) מצורפת וטבלת
// פריטים עם תמונת thumbnail. משתמש ב-Gmail SMTP (nodemailer) עם App
// Password של Oren - לא Resend יותר.
//
// **למה עברנו מ-Resend (2026-09)**: כל עוד אין דומיין אמיתי מאומת מול
// Resend, ה-sandbox שלהם (onboarding@resend.dev) יכול לשלוח *רק* לכתובת
// שנרשמת איתה ל-Resend עצמו - כל נמען אחר (למשל לקוח אמיתי, או אשתו של
// Oren בבדיקה) מקבל 403 בשקט (רק ל-console.error ב-routes/orders.ts,
// לא משפיע על ההזמנה עצמה - זה איך שהתקלה התגלתה בכלל: הזמנה הצליחה,
// מייל פשוט לא הגיע, בלי שגיאה גלויה). רכישת דומיין אפשרית אבל לא
// חובה - Gmail SMTP שולח לכל נמען אמיתי מיידית, בחינם, בלי דומיין.
//
// למה thumbnail הוא צירוף inline (CID) ולא <img src="https://...">: אין
// עדיין deploy ציבורי של ה-backend (רץ רק על localhost שלך) - שרתי המייל
// של הנמען לא יכולים לטעון תמונה מ-localhost. nodemailer תומך בהטמעת
// תמונה כצירוף עם שדה cid, ומפנים אליה מה-HTML עם cid:<id> - זה עובד גם
// בלי URL ציבורי בכלל, כי בייטי התמונה נשלחים בתוך המייל עצמו.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extensionToMimeType } from "./mime.js";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { generateGiftPdf } from "./giftPdf.js";
import { formatAgorot } from "./money.js";
import { PUBLIC_IMAGES_DIR } from "./paths.js";

// service: "gmail" - קונפיגורציית ה-host/port/secure המוכרת של Gmail
// SMTP מובנית ב-nodemailer, לא צריך לפרט אותם ידנית. auth.pass הוא ה-
// App Password (16 תווים), לא סיסמת החשבון הרגילה - Gmail חוסם login
// SMTP עם סיסמה רגילה כשיש 2-Step Verification מופעל (וזו דרישת סף
// ליצירת App Password מלכתחילה).
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
});

export type ThankYouEmailItem = {
  name: string;
  quantity: number;
  unitPriceAgorot: number;
  /** URL יחסי כמו "/images/foo.webp", או null אם לא נמצאה תמונת flat תואמת */
  imageUrl: string | null;
  /**
   * תיאור הבחירה (Fit/Colorway/Size...) - אותם רכיבים לא-מחוברים שנשמרים
   * כ-selectionLabelSnapshot ב-DB (backend/src/lib/variantLabel.ts), locale
   * אנגלית בלבד - כל שאר תוכן המייל הזה אנגלי (placeholder, ראו README).
   * null אם למוצר אין בכלל צירי וריאנט (לא קורה היום בפועל, אבל
   * selectionLabelSnapshot עצמו nullable ב-DB אז שומרים על אותה גמישות).
   */
  selectionLabel: string[] | null;
};

// בריחה בסיסית ל-HTML - חשוב כאן כי שלא כמו שאר התוכן הקבוע בקובץ הזה,
// שדות הכתובת (ושם הפריט, שם הנמען) מגיעים ממשתמש אמיתי דרך טופס ה-checkout -
// בלי escaping תו כמו "<" בשם רחוב היה יכול לשבור את מבנה ה-HTML של המייל.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_COPY = {
  subject: "Your (very fake) Dull order confirmation",
  intro: (recipientName: string, orderId: string) => `
    <h1>Thanks, ${recipientName}!</h1>
    <p>Your order <strong>${orderId}</strong> is confirmed - and, to be crystal
    clear, <strong>completely free</strong>. This is an educational/demo
    project; no real payment was taken and nothing will actually ship.</p>
  `,
  outro: `
    <p>We attached a small printable gift as a thank-you for playing along.</p>
    <p style="color:#888;font-size:12px;">Dull - an educational/demo project.</p>
  `,
};

function buildItemsTableHtml(items: ThankYouEmailItem[], contentIdByIndex: (index: number) => string): string {
  const rows = items
    .map((item, index) => {
      const thumbnailCell = item.imageUrl
        ? `<img src="cid:${contentIdByIndex(index)}" width="64" height="64" style="object-fit:cover;border-radius:4px;" alt="${item.name}">`
        : "";
      const lineTotal = formatAgorot(item.unitPriceAgorot * item.quantity);
      // שורת המפרט (למשל "Men's · Light · M") מתחת לשם, בדיוק כמו בעגלה/
      // checkout/היסטוריית הזמנות (joinSelectionLabelParts ב-frontend, אותו
      // מפריד " · ") - כדי שהמייל יתאם למה שהמשתמש ראה באתר. מוצג רק אם יש
      // בכלל מפרט (למוצרים בלי צירי וריאנט - לא קורה היום - selectionLabel יהיה ריק/null).
      const selectionLabelHtml =
        item.selectionLabel && item.selectionLabel.length > 0
          ? `<div style="color:#888;font-size:12px;margin-top:2px;">${escapeHtml(item.selectionLabel.join(" · "))}</div>`
          : "";
      return `
        <tr>
          <td style="padding:8px;">${thumbnailCell}</td>
          <td style="padding:8px;">${escapeHtml(item.name)}${selectionLabelHtml}</td>
          <td style="padding:8px;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;text-align:left;">${formatAgorot(item.unitPriceAgorot)}</td>
          <td style="padding:8px;text-align:left;"><strong>${lineTotal}</strong></td>
        </tr>
      `;
    })
    .join("");

  return `
    <table style="border-collapse:collapse;width:100%;margin:16px 0;" cellspacing="0" cellpadding="0">
      <thead>
        <tr style="border-bottom:2px solid #ddd;text-align:left;">
          <th></th>
          <th style="padding:8px;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;">Price</th>
          <th style="padding:8px;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// תוויות ידידותיות לשדות הכתובת הידועים כיום (frontend/src/types/order.ts,
// ShippingAddress) - shippingAddress עצמו חופשי לגמרי בסכימה (Json, אין
// עדיין טופס משלוח סופי ב-PRD, ראו routes/orders.ts), אז מפתח לא-מוכר
// (אם הטופס ישתנה בעתיד) עדיין מוצג - רק עם שם השדה הגולמי כתווית fallback,
// לא נעלם בשקט. כך "כל הפרטים שהוזנו" מוצגים תמיד, גם בלי לתאם שוב את שני
// הצדדים בכל שינוי טופס.
const SHIPPING_FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  phone: "Phone",
  addressLine: "Address",
  city: "City",
  postalCode: "Postal code",
};

function buildShippingAddressHtml(shippingAddress: Record<string, unknown>): string {
  const rows = Object.entries(shippingAddress)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => {
      const label = SHIPPING_FIELD_LABELS[key] ?? key;
      return `
        <tr>
          <td style="padding:2px 12px 2px 0;color:#888;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:2px 0;">${escapeHtml(String(value))}</td>
        </tr>
      `;
    })
    .join("");

  if (!rows) return "";

  return `
    <div style="margin:16px 0;">
      <p style="margin:0 0 4px;font-weight:bold;">Shipping to</p>
      <table style="border-collapse:collapse;" cellspacing="0" cellpadding="0">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// קורא קובץ תמונה מ-public/images לצורך צירוף inline. לא מפיל את כל
// שליחת המייל אם קובץ בודד חסר (למשל npm run images:generate לא רץ) -
// פשוט לא יהיה thumbnail לפריט הזה, השאר עדיין נשלח.
async function tryReadImageFile(imageUrl: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(PUBLIC_IMAGES_DIR, path.basename(imageUrl));
    return await readFile(filePath);
  } catch (err) {
    console.error(`Could not read image for email thumbnail: ${imageUrl}`, err);
    return null;
  }
}

export async function sendThankYouEmail(params: {
  toEmail: string;
  recipientName: string;
  orderId: string;
  totalAgorot: number;
  items: ThankYouEmailItem[];
  /**
   * אותו Json חופשי שנשמר על ה-Order (routes/orders.ts, body.shippingAddress) -
   * בפועל תמיד ShippingAddress מה-frontend, אבל לא מוולד כאן, ראו
   * buildShippingAddressHtml. חשוב לאשר למשתמש שהכתובת נקלטה נכון (Oren,
   * 2026-09-10) - זה כל הסיבה שזה נמצא במייל בכלל.
   */
  shippingAddress: Record<string, unknown>;
}): Promise<void> {
  const giftPdf = await generateGiftPdf(params.recipientName);

  // רק לפריטים שבאמת יש להם תמונה זמינה על דיסק מקבלים contentId - כך
  // buildItemsTableHtml והאינדקסים ב-attachments תמיד מסונכרנים.
  const contentIdByIndex = (index: number) => `item-image-${index}`;
  const imageAttachments = await Promise.all(
    params.items.map(async (item, index) => {
      if (!item.imageUrl) return null;
      const content = await tryReadImageFile(item.imageUrl);
      if (!content) return null;
      const filename = path.basename(item.imageUrl);
      return {
        filename,
        content,
        cid: contentIdByIndex(index),
        contentType: extensionToMimeType(filename),
      };
    }),
  );

  const itemsTableHtml = buildItemsTableHtml(params.items, contentIdByIndex);
  const shippingAddressHtml = buildShippingAddressHtml(params.shippingAddress);

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: params.toEmail,
    subject: EMAIL_COPY.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        ${EMAIL_COPY.intro(params.recipientName, params.orderId)}
        ${itemsTableHtml}
        <p style="text-align:right;font-size:18px;">Total: <strong>${formatAgorot(params.totalAgorot)}</strong></p>
        ${shippingAddressHtml}
        ${EMAIL_COPY.outro}
      </div>
    `,
    attachments: [
      { filename: "dull-gift.pdf", content: giftPdf },
      ...imageAttachments.filter((a): a is NonNullable<typeof a> => a !== null),
    ],
  });
}
