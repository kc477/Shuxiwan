// Lightweight cookie-based "session" for MVP. Real auth comes later — for now
// the session just remembers which user the browser is acting as.
//
// Design: a single signed cookie holds the userId. We don't sign yet (MVP);
// when auth lands we'll switch to NextAuth or a JWT-backed session.

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "sxw_uid";

export async function getCurrentUser() {
  const uid = cookies().get(COOKIE_NAME)?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export function setSessionCookie(userId: string) {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}
