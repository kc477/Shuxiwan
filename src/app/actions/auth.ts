"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

// MVP "auth": you give a name, we mint or reuse a User. Phone-verified login
// will replace this; until then this lets us click through the whole flow.
export async function quickSignIn(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const eventId = String(formData.get("eventId") ?? "");
  if (!name) return;

  let user = await prisma.user.findFirst({ where: { name } });
  if (!user) user = await prisma.user.create({ data: { name } });

  setSessionCookie(user.id);

  if (eventId) {
    await prisma.eventParticipant.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      update: {},
      create: { userId: user.id, eventId },
    });
    redirect(`/events/${eventId}/profile`);
  }
  redirect("/");
}

export async function signOut() {
  clearSessionCookie();
  redirect("/");
}
