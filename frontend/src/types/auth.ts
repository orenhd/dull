// טיפוס המשתמש כפי שה-API מחזיר מ-POST /auth/google (docs/API_CONTRACT.md) -
// { id, email, name } בלבד, בלי שדות פנימיים (provider, createdAt וכו') שה-
// frontend לא צריך.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
