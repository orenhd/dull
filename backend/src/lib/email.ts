// שליחת מייל התודה ההומוריסטי אחרי הזמנה, עם ה"מתנה" (PDF) מצורפת. משתמש
// ב-Resend (resend.com) - free tier, לא צריך SMTP/App Password אישי.
// כל טקסט המייל מרוכז ב-EMAIL_COPY למטה בכוונה, מאותה סיבה כמו ב-giftPdf.ts.
import { Resend } from "resend";
import { env } from "../config/env.js";
import { generateGiftPdf } from "./giftPdf.js";

const resend = new Resend(env.RESEND_API_KEY);

const EMAIL_COPY = {
  subject: "Your (very fake) Dull order confirmation",
  html: (recipientName: string, orderId: string) => `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1>Thanks, ${recipientName}!</h1>
      <p>Your order <strong>${orderId}</strong> is confirmed - and, to be crystal
      clear, <strong>completely free</strong>. This is an educational/demo
      project; no real payment was taken and nothing will actually ship.</p>
      <p>We attached a small printable gift as a thank-you for playing along.</p>
      <p style="color:#888;font-size:12px;">Dull - an educational/demo project.</p>
    </div>
  `,
};

// לא מפילים את יצירת ההזמנה אם שליחת המייל נכשלת (ספק מייל למטה, מפתח
// שגוי וכו') - ההזמנה כבר נשמרה ב-DB, זו רק תוספת "נחמד שיהיה". הקורא
// (routes/orders.ts) קורא ל-catch משלו ורק רושם ל-log, לא מחזיר שגיאה ללקוח.
export async function sendThankYouEmail(params: {
  toEmail: string;
  recipientName: string;
  orderId: string;
}): Promise<void> {
  const giftPdf = await generateGiftPdf(params.recipientName);

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.toEmail,
    subject: EMAIL_COPY.subject,
    html: EMAIL_COPY.html(params.recipientName, params.orderId),
    attachments: [
      {
        filename: "dull-gift.pdf",
        content: giftPdf,
      },
    ],
  });
}
