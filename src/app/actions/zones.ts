"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma, toJson } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const CreateSchema = z.object({
  eventId: z.string(),
  zoneSlotId: z.string(),
  title: z.string().min(2).max(30),
  question: z.string().min(2).max(120),
  tags: z.array(z.string()).max(3).default([]),
});

export async function createZone(input: unknown) {
  const me = await requireUser();
  const data = CreateSchema.parse(input);

  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new Error("EVENT_NOT_FOUND");

  const zone = await prisma.zone.create({
    data: {
      eventId: data.eventId,
      zoneSlotId: data.zoneSlotId,
      creatorId: me.id,
      title: data.title,
      question: data.question,
      tags: toJson(data.tags),
      status: "gathering",
      expiresAt: event.endTime,
      members: { create: { userId: me.id } },
    },
  });
  await logActivity(data.eventId, me.id, "created_zone", {
    zoneId: zone.id,
    title: zone.title,
  });
  revalidatePath(`/events/${data.eventId}`);
  redirect(`/events/${data.eventId}/zones/${zone.id}`);
}

export async function joinZone(zoneId: string) {
  const me = await requireUser();
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) throw new Error("ZONE_NOT_FOUND");
  const existing = await prisma.zoneMember.findUnique({
    where: { zoneId_userId: { zoneId, userId: me.id } },
  });
  await prisma.zoneMember.upsert({
    where: { zoneId_userId: { zoneId, userId: me.id } },
    update: { leftAt: null },
    create: { zoneId, userId: me.id },
  });
  // Promote to active when ≥3 members.
  const memberCount = await prisma.zoneMember.count({
    where: { zoneId, leftAt: null },
  });
  if (memberCount >= 3 && zone.status === "gathering") {
    await prisma.zone.update({ where: { id: zoneId }, data: { status: "active" } });
  }
  if (!existing && me.id !== zone.creatorId) {
    await logActivity(zone.eventId, me.id, "joined_zone", {
      zoneId,
      title: zone.title,
    });
  }
  revalidatePath(`/events/${zone.eventId}`);
  revalidatePath(`/events/${zone.eventId}/zones/${zoneId}`);
}

export async function leaveZone(zoneId: string) {
  const me = await requireUser();
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) return;
  await prisma.zoneMember.update({
    where: { zoneId_userId: { zoneId, userId: me.id } },
    data: { leftAt: new Date() },
  });
  revalidatePath(`/events/${zone.eventId}`);
  revalidatePath(`/events/${zone.eventId}/zones/${zoneId}`);
}

export async function markArrived(zoneId: string) {
  const me = await requireUser();
  await prisma.zoneMember.update({
    where: { zoneId_userId: { zoneId, userId: me.id } },
    data: { arrived: true },
  });
  revalidatePath(`/events/*/zones/${zoneId}`);
}
