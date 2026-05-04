import { notFound, redirect } from "next/navigation";
import { prisma, fromJson } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { NewZoneForm } from "./new-zone-form";

export const dynamic = "force-dynamic";

export default async function NewZonePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { slotId?: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { zoneSlots: true },
  });
  if (!event) notFound();
  const me = await getCurrentUser();
  if (!me) redirect(`/events/${params.id}`);
  const profile = await prisma.profile.findUnique({
    where: { userId_eventId: { userId: me.id, eventId: event.id } },
  });
  if (!profile?.completed) redirect(`/events/${params.id}/profile`);

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">发起一个 zone</h1>
        <p className="mt-1 text-xs text-ink-500">
          一句话主题 + 你想讨论的具体问题。系统会推送给可能感兴趣的人。
        </p>
      </header>

      <NewZoneForm
        eventId={event.id}
        slots={event.zoneSlots
          .filter((s) => s.allowUserZone)
          .map((s) => ({ id: s.id, name: s.name }))}
        defaultSlotId={searchParams.slotId}
        presetTopics={fromJson<string[]>(event.presetTopics, [])}
      />
    </main>
  );
}
