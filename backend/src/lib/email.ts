// שליחת מייל התודה ההומוריסטי אחרי הזמנה, עם ה"מתנה" (PDF) מצורפת וטבלת
// פריטים עם תמונת thumbnail. משתמש ב-Resend (resend.com) - free tier, לא
// צריך SMTP/App Password אישי.
//
// למה thumbnail הוא צירוף inline (CID) ולא <img src="https://...">: אין
// עדיין deploy ציבורי של ה-backend (רץ רק על localhost שלך) - שרתי המייל
// של הנמען לא יכולים לטעון תמונה מ-localhost. Resend תומך בהטמעת תמונה
// כצירוף עם contentId, ומפנים אליה מה-HTML עם cid:<contentId> - זה עובד
// גם בלי URL ציבורי בכלל, כי בייטים התמונה נשלחים בתוך המייל עצמו.
//
// חשוב: contentId לבד לא מספיק ל-Gmail בפועל - בלי contentType מפורש
// (image/webp וכו') הוא לא מזהה את הצירוף כתמונה-להטמעה ומציג אותו כקובץ
// מצורף רגיל, עם ה-<img> בגוף המייל שבור. זה תועד ב-Resend עצמם כ"מומלץ
// לרינדור תקין" - לא ניחוש.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extensionToMimeType } from "./mime.js";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { generateGiftPdf } from "./giftPdf.js";
import { formatAgorot } from "./money.js";
import { PUBLIC_IMAGES_DIR } from "./paths.js";

const resend = new Resend(env.RESEND_API_KEY);

export type ThankYouEmailItem = {
  name: string;
  quantity: number;
  unitPriceAgorot: number;
  /** URL יחסי כמו "/images/foo.webp", או null אם לא נמצאה תמונת flat תואמת */
  imageUrl: string | null;
};

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
      return `
        <tr>
          <td style="padding:8px;">${thumbnailCell}</td>
          <td style="padding:8px;">${item.name}</td>
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
        contentId: contentIdByIndex(index),
        contentType: extensionToMimeType(filename),
      };
    }),
  );

  const itemsTableHtml = buildItemsTableHtml(params.items, contentIdByIndex);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.toEmail,
    subject: EMAIL_COPY.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        ${EMAIL_COPY.intro(params.recipientName, params.orderId)}
        ${itemsTableHtml}
        <p style="text-align:right;font-size:18px;">Total: <strong>${formatAgorot(params.totalAgorot)}</strong></p>
        ${EMAIL_COPY.outro}
      </div>
    `,
    attachments: [
      { filename: "dull-gift.pdf", content: giftPdf },
      ...imageAttachments.filter((a): a is NonNullable<typeof a> => a !== null),
    ],
  });
}
