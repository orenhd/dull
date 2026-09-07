// מייצר גרסה ריבועית 120x120 של hi-res/dull-logo.svg לצורך Google OAuth
// consent screen (Branding -> Logo). לא build step קבוע כמו generate-web-
// images.ts - מריצים פעם אחת, ושוב רק אם הלוגו המקורי משתנה.
//
// הערה חשובה: זה wordmark אופקי (189x45), לא סימן ריבועי - הדחיסה שלו
// לתוך ריבוע 120x120 עם ריווח משאירה טקסט די דק/קטן. מספיק בהחלט בשביל
// שדה זיהוי בעמוד הסכמה של גוגל (מוצג שם בגודל סביר, לא כ-favicon
// זעיר), אבל אם ירצו איזון עתידי - worth designing an actual square
// monogram mark separately.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_SVG = path.join(__dirname, "../../hi-res/dull-logo.svg");
const OUTPUT_PNG = path.join(__dirname, "../../hi-res/dull-logo-square-120.png");

const CANVAS_SIZE = 120; // דרישת גוגל: 120x120
const LOGO_WIDTH = 96; // משאיר ~12px ריווח מכל צד

async function main() {
  const svgBuffer = readFileSync(SOURCE_SVG);

  const logoBuffer = await sharp(svgBuffer, { density: 300 })
    .resize({ width: LOGO_WIDTH })
    .toBuffer();
  const logoMeta = await sharp(logoBuffer).metadata();

  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // רקע לבן - הטקסט במקור כהה (#2E2E2E), בטוח על כל רקע דיאלוג
    },
  })
    .composite([
      {
        input: logoBuffer,
        top: Math.round((CANVAS_SIZE - (logoMeta.height ?? 0)) / 2),
        left: Math.round((CANVAS_SIZE - (logoMeta.width ?? 0)) / 2),
      },
    ])
    .png()
    .toFile(OUTPUT_PNG);

  console.log(`Wrote ${OUTPUT_PNG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
