// PrismaClient יחיד לכל התהליך - לא ליצור instance חדש בכל קובץ/בקשה,
// כדי לא לפתוח חיבור DB נוסף בכל import (רלוונטי במיוחד ב-dev עם reload).
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
