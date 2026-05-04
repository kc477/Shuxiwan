"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma, toJson, fromJson } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const CreateSchema = z.object({
  name: z.string().min(2).max(80),
  startTime: z.string(),
  endTime: z.string(),
  locationName: z.string().min(1).max(80),
  presetTopics: z.array(z.string()).default([]),
  capacity: z.number().int().positive().optional(),
});

export async function createEvent(input: unknown) {
  const me = await requireUser();
  const data = CreateSchema.parse(input);
  const e = await prisma.event.create({
    data: {
      organizerId: me.id,
      name: data.name,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      locationName: data.locationName,
      presetTopics: toJson(data.presetTopics),
      capacity: data.capacity,
      status: "draft",
    },
  });
  redirect(`/admin/events/${e.id}/map`);
}

export async function publishEvent(eventId: string) {
  await requireUser();
  await prisma.event.update({ where: { id: eventId }, data: { status: "live" } });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
}

const SlotSchema = z.object({
  eventId: z.string(),
  slots: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(40),
        shape: z.object({
          type: z.enum(["rect"]),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
        capacityHint: z.number().int().positive().optional(),
        allowUserZone: z.boolean().default(true),
      })
    )
    .max(20),
});

export async function saveZoneSlots(input: unknown) {
  await requireUser();
  const data = SlotSchema.parse(input);
  // Replace strategy: delete missing, upsert provided. Simpler than diffing
  // for MVP.
  const existing = await prisma.zoneSlot.findMany({ where: { eventId: data.eventId } });
  const keepIds = new Set(data.slots.filter((s) => s.id).map((s) => s.id!));
  const toDelete = existing.filter((s) => !keepIds.has(s.id)).map((s) => s.id);
  if (toDelete.length) {
    await prisma.zoneSlot.deleteMany({ where: { id: { in: toDelete } } });
  }
  for (const s of data.slots) {
    if (s.id) {
      await prisma.zoneSlot.update({
        where: { id: s.id },
        data: {
          name: s.name,
          shape: toJson(s.shape),
          capacityHint: s.capacityHint,
          allowUserZone: s.allowUserZone,
        },
      });
    } else {
      await prisma.zoneSlot.create({
        data: {
          eventId: data.eventId,
          name: s.name,
          shape: toJson(s.shape),
          capacityHint: s.capacityHint,
          allowUserZone: s.allowUserZone,
        },
      });
    }
  }
  revalidatePath(`/admin/events/${data.eventId}/map`);
  revalidatePath(`/events/${data.eventId}`);
}

export async function getEventForGrid(eventId: string) {
  const e = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      zoneSlots: true,
      zones: {
        where: { status: { in: ["gathering", "active"] } },
        include: { members: { where: { leftAt: null }, include: { user: true } } },
      },
    },
  });
  if (!e) return null;
  return {
    ...e,
    presetTopics: fromJson<string[]>(e.presetTopics, []),
    zoneSlots: e.zoneSlots.map((s) => ({
      ...s,
      shape: fromJson<{ type: string; x: number; y: number; w: number; h: number }>(s.shape, {
        type: "rect",
        x: 0,
        y: 0,
        w: 0,
        h: 0,
      }),
    })),
    zones: e.zones.map((z) => ({
      ...z,
      tags: fromJson<string[]>(z.tags, []),
    })),
  };
}
