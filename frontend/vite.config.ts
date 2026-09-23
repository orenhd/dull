import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // svgr (docs/PRD.md סעיף 60, בקשת Oren 2026-09-23) - המקביל של Vite
  // למה שאורן נהג להשתמש בו ב-webpack (import { ReactComponent as X }
  // מקובץ .svg, דרך תוסף webpack) - לא מיושן, זה בדיוק אותו רעיון/ספרייה
  // (SVGR) עם אינטגרציית-Vite במקום webpack-loader. תחביר הייבוא ב-Vite
  // שונה מעט מ-CRA/webpack: `import Icon from "./icon.svg?react"`
  // (default export + סיומת שאילתת `?react`), לא named `ReactComponent`.
  // ראו src/assets/icons/README.md להסבר המלא של המוסכמה.
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
