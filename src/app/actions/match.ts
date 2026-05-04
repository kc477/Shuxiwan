"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";

// Express interest: A → B. If B has already done B → A, create a Match and
// surface wechat ids.
export async function expressIntent(eventId: string, toUserId: string, reason: string) {
  const me = await requireUser();
  if (me.id === toUserId) return { matched: false };

  await prisma.matchIntent.upsert({
    where: { eventId_fromId_toId: { eventId, fromId: me.id, toId: toUserId } },
    update: { reason },
    create: { eventId, fromId: me.id, toId: toUserId, reason },
  });

  const reverse = await prisma.matchIntent.findUnique({
    where: { eventId_fromId_toId: { eventId, fromId: toUserId, toId: me.id } },
  });

  if (reverse) {
    const [aId, bId] = me.id < toUserId ? [me.id, toUserId] : [toUserId, me.id];
    const existing = await prisma.match.findUnique({
      where: { eventId_userAId_userBId: { eventId, userAId: aId, userBId: bId } },
    });
    await prisma.match.upsert({
      where: { eventId_userAId_userBId: { eventId, userAId: aId, userBId: bId } },
      update: {},
      create: {
        eventId,
        userAId: aId,
        userBId: bId,
        reasonForA: aId === me.id ? reason : reverse.reason,
        reasonForB: bId === me.id ? reason : reverse.reason,
      },
    });
    if (!existing) {
      const other = await prisma.user.findUnique({ where: { id: toUserId } });
      await logActivity(eventId, me.id, "matched", {
        otherUserId: toUserId,
        otherName: other?.name ?? "",
      });
    }
    revalidatePath(`/events/${eventId}/recommendations`);
    return { matched: true };
  }
  revalidatePath(`/events/${eventId}/recommendations`);
  return { matched: false };
}

export async function skipRecommendation(eventId: string, toUserId: string) {
  const me = await requireUser();
  // Persist as a "skip" by writing a soft tombstone — for V1 we just track
  // it on a future SkippedSuggestion table. For now: drop it.
  void me;
  void eventId;
  void toUserId;
}
