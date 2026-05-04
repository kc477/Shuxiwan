"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma, fromJson, toJson } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ai, type ChatTurn, type ProfileFields } from "@/lib/ai";

const FormSchema = z.object({
  eventId: z.string().min(1),
  company: z.string().max(80).optional(),
  role: z.string().optional(),
  stage: z.string().optional(),
  domains: z.array(z.string()).default([]),
  eventTopics: z.array(z.string()).default([]),
});

export async function saveProfileBasics(input: unknown) {
  const me = await requireUser();
  const data = FormSchema.parse(input);

  await prisma.profile.upsert({
    where: { userId_eventId: { userId: me.id, eventId: data.eventId } },
    update: {
      company: data.company,
      role: data.role,
      stage: data.stage,
      domains: toJson(data.domains),
      eventTopics: toJson(data.eventTopics),
    },
    create: {
      userId: me.id,
      eventId: data.eventId,
      company: data.company,
      role: data.role,
      stage: data.stage,
      domains: toJson(data.domains),
      eventTopics: toJson(data.eventTopics),
    },
  });

  revalidatePath(`/events/${data.eventId}/profile`);
  redirect(`/events/${data.eventId}/profile/chat`);
}

export async function chatStep(eventId: string, history: ChatTurn[]) {
  await requireUser();
  const next = await ai().nextProfileTurn(history);
  return next;
}

export async function saveProfileSoft(eventId: string, fields: ProfileFields) {
  const me = await requireUser();
  await prisma.profile.update({
    where: { userId_eventId: { userId: me.id, eventId } },
    data: {
      currentFocus: fields.currentFocus,
      currentChallenge: fields.currentChallenge,
      lookingFor: fields.lookingFor,
      canOffer: fields.canOffer,
      completed: true,
    },
  });
  // Generate embedding lazily on first recommend; nothing else to do here.
  redirect(`/events/${eventId}`);
}

export async function getProfile(eventId: string) {
  const me = await requireUser();
  const p = await prisma.profile.findUnique({
    where: { userId_eventId: { userId: me.id, eventId } },
  });
  if (!p) return null;
  return {
    ...p,
    domains: fromJson<string[]>(p.domains, []),
    eventTopics: fromJson<string[]>(p.eventTopics, []),
  };
}
