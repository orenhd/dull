// POST /auth/google - נקודת הכניסה היחידה ל-login. ה-frontend כבר עשה את כל
// ה-UI/redirect flow מול Google בעצמו (Google Identity Services) ומעביר לנו
// רק את ה-ID token לאימות. אין כאן שום דבר ספציפי-ל-Google מעבר לפונקציית
// verifyGoogleIdToken - הוספת ספק login נוספת תהיה route אחות, לא שינוי כאן.
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyGoogleIdToken, signSessionToken, verifySessionToken, sessionCookieOptions } from "../lib/auth.js";
import { SESSION_COOKIE_NAME } from "../constants/index.js";

export const authRouter = Router();

const googleLoginSchema = z.object({
  credential: z.string().min(1), // ה-ID token שמגיע מ-Google Identity Services בדפדפן
});

authRouter.post("/google", async (req, res, next) => {
  try {
    const body = googleLoginSchema.parse(req.body);
    const identity = await verifyGoogleIdToken(body.credential);

    // מחפשים קודם לפי (provider, providerUserId) - הזיהוי היציב באמת.
    // רק אם זו הפעם הראשונה שרואים את הזהות הזו, מנסים לאחד לפי מייל
    // (מקרה: אותו אדם יתחבר יום אחד גם עם ספק אחר עם אותו מייל מאומת).
    let identityRow = await prisma.userIdentity.findUnique({
      where: { provider_providerUserId: { provider: "GOOGLE", providerUserId: identity.providerUserId } },
      include: { user: true },
    });

    if (!identityRow) {
      const existingUser = await prisma.user.findUnique({ where: { email: identity.email } });

      const user =
        existingUser ??
        (await prisma.user.create({
          data: { email: identity.email, name: identity.name },
        }));

      identityRow = await prisma.userIdentity.create({
        data: { userId: user.id, provider: "GOOGLE", providerUserId: identity.providerUserId },
        include: { user: true },
      });
    }

    const token = signSessionToken(identityRow.user.id);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.json({
      user: { id: identityRow.user.id, email: identityRow.user.email, name: identityRow.user.name },
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me - בדיקת מצב התחברות בטעינת/רענון דף. ה-session cookie הוא
// httpOnly בכוונה (הגנה מפני XSS) - כלומר JS בצד הלקוח לא יכול לקרוא אותו
// בעצמו כדי לדעת אם המשתמש מחובר. זה route "בדיקת מצב", לא "פעולה שיכולה
// להיכשל": חוסר-חיבור הוא תוצאה תקנית (200 { user: null }), לא שגיאה
// (401) - כך שה-frontend לא צריך לתפוס שגיאה בכל טעינת עמוד רגילה. בכוונה
// לא משתמשים ב-requireAuth middleware כאן - הוא עונה 401 על חוסר-session,
// בדיוק ההתנהגות שלא רוצים ב-route הזה.
authRouter.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const session = typeof token === "string" ? verifySessionToken(token) : null;

    if (!session) {
      res.json({ user: null });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    res.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
  res.json({ ok: true });
});
