import { notFound, redirect } from "next/navigation";
import { prisma, fromJson } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  const me = await getCurrentUser();
  if (!me) redirect(`/events/${params.id}`);

  const profile = await prisma.profile.findUnique({
    where: { userId_eventId: { userId: me.id, eventId: event.id } },
  });

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-6">
        <div className="text-xs text-ink-500">{event.name}</div>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">先把基础画像填一下</h1>
        <p className="mt-1 text-xs text-ink-500">
          下一步是 90 秒的对话，把你正在做的事讲清楚。
        </p>
      </header>

      <ProfileForm
        eventId={event.id}
        presetTopics={fromJson<string[]>(event.presetTopics, [])}
        initial={
          profile && {
            company: profile.company ?? "",
            role: profile.role ?? "",
            stage: profile.stage ?? "",
            domains: fromJson<string[]>(profile.domains, []),
            eventTopics: fromJson<string[]>(profile.eventTopics, []),
          }
        }
      />
    </main>
  );
}
