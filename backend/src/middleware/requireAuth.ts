// חוסם routes שדורשים משתמש מחובר (checkout, היסטוריית הזמנות). לא נוגע
// ב-guest browsing - ה-middleware הזה פשוט לא מותקן על routes של קטלוג.
import type { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../lib/auth.js";
import { SESSION_COOKIE_NAME } from "../constants/index.js";

// מרחיבים את Express.Request כדי ש-req.user יהיה מוכר ל-TypeScript בכל
// route שמותקן אחרי ה-middleware הזה, בלי any מפוזר.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = typeof token === "string" ? verifySessionToken(token) : null;

  if (!session) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  req.user = { id: session.userId };
  next();
}
