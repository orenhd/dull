// ממיר את hi-res/*.{jpg,png} לגרסאות web דחוסות (WebP, רוחב מקס' 1600px) לתוך
// backend/public/images/, שם Express מגיש אותן. מריצים ידנית עם `npm run images:generate`
// בכל פעם שנוספים/משתנים חומרים חזותיים ב-hi-res.
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HI_RES_DIR = path.resolve(__dirname, "../../hi-res");
const OUTPUT_DIR = path.resolve(__dirname, "../public/images");
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const entries = await readdir(HI_RES_DIR, { withFileTypes: true });
  const sourceFiles = entries.filter(
    (e) => e.isFile() && SOURCE_EXTENSIONS.has(path.extname(e.name).toLowerCase())
  );

  for (const file of sourceFiles) {
    const inputPath = path.join(HI_RES_DIR, file.name);
    const baseName = path.basename(file.name, path.extname(file.name));
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.webp`);

    await sharp(inputPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    console.log(`${file.name} -> ${path.relative(process.cwd(), outputPath)}`);
  }

  console.log(`\nDone: ${sourceFiles.length} images processed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
