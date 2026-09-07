// יוצר את ה"מתנה" הוירטואלית המצורפת למייל התודה - PDF להדפסה. התוכן כאן
// הוא placeholder בכוונה (ראו GIFT_COPY למטה) - העיצוב הסופי (מעטפה
// מתקפלת A4) הוא עבודת תוכן/עיצוב נפרדת, לא חלק מהמנגנון הזה. כל הטקסט
// מרוכז באובייקט אחד כדי שהחלפתו בעתיד תהיה עריכת תוכן, לא שינוי לוגיקה.
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

const GIFT_COPY = {
  title: "Thank you for your (fake) purchase!",
  body: [
    "This is a placeholder gift card - the real one (a foldable A4",
    "envelope design) is still being designed.",
    "",
    "For now, enjoy this extremely serious certificate confirming",
    "that no money changed hands and nothing will be shipped.",
  ],
  footer: "Dull - an educational/demo project.",
};

export async function generateGiftPdf(recipientName: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 72; // 1 inch, יחידת PDF סטנדרטית - לא שרירותי

  let cursorY = height - margin;

  page.drawText(GIFT_COPY.title, {
    x: margin,
    y: cursorY,
    size: 24,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 40;

  page.drawText(`For: ${recipientName}`, {
    x: margin,
    y: cursorY,
    size: 14,
    font: bodyFont,
  });
  cursorY -= 32;

  for (const line of GIFT_COPY.body) {
    page.drawText(line, { x: margin, y: cursorY, size: 12, font: bodyFont });
    cursorY -= 18;
  }

  page.drawText(GIFT_COPY.footer, {
    x: margin,
    y: margin,
    size: 10,
    font: bodyFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
