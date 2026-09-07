// כל מה שקשור לאימות משתמש מרוכז כאן: אימות טוקן מול Google, session JWT
// משלנו (חתום, לא מוצפן - לא לשים בו מידע רגיש, רק userId), ו-cookie options.
// הוספת ספק login עתידי (Facebook וכו') אומרת: פונקציית verify* חדשה כאן +
// שורה חדשה ב-enum AuthProvider - לא נגיעה בשאר הקוד.
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";
import { SESSION_COOKIE_MAX_AGE_MS } from "../constants/index.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export type VerifiedIdentity = {
  providerUserId: string; // ה-sub היציב אצל הספק
  email: string;
  name: string | null;
};

// מאמת ID token שהתקבל מ-Google Identity Services בצד ה-frontend (לא מבצעים
// כאן שום redirect flow משלנו - Google כבר אימתה את המשתמש בדפדפן שלו,
// אנחנו רק מוודאים שהטוקן חתום ע"י Google ומיועד ל-client ID שלנו).
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedIdentity> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("INVALID_GOOGLE_TOKEN");
  }
  return {
    providerUserId: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
}

type SessionPayload = { userId: string };

export function signSessionToken(userId: string): string {
  return jwt.sign({ userId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS / 1000,
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "object" && decoded && "userId" in decoded) {
      return { userId: String((decoded as SessionPayload).userId) };
    }
    return null;
  } catch {
    return null; // חתימה לא תקינה או פג תוקף - מתייחסים כמו "לא מחובר", לא זורקים
  }
}

// httpOnly כדי ש-JS בצד הלקוח לא יוכל לקרוא את העוגייה (מגן על XSS גונב-session).
// secure מופעל רק כש-NODE_ENV=production כי בפיתוח מקומי (http://localhost)
// דפדפנים חוסמים עוגיות עם secure על חיבור לא-https.
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  };
}
