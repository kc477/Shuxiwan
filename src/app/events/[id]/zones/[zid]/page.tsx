import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, fromJson } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { JoinControls } from "./join-controls";

export const dynamic = "force-dynamic";

export default async function ZonePage({
  params,
}: {
  params: { id: string; zid: string };
}) {
  const zone = await prisma.zone.findUnique({
    where: { id: params.zid },
    include: {
      zoneSlot: true,
      creator: true,
      members: {
        where: { leftAt: null },
        include: {
          user: {
            include: {
              profiles: { where: { eventId: params.id } },
            },
          },
        },
      },
    },
  });
  if (!zone || zone.eventId !== params.id) notFound();

  const me = await getCurrentUser();
  const myMembership = me ? zone.members.find((m) => m.userId === me.id) : null;

  return (
    <main className="px-5 pb-16 pt-6">
      <Link
        href={`/events/${params.id}`}
        className="text-xs text-ink-500 hover:text-ink-900"
      >
        ← 回到现场
      </Link>

      <header className="mt-3">
        <h1 className="text-xl font-semibold text-ink-900">{zone.title}</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
          <span>📍 {zone.zoneSlot.name}</span>
          <span>·</span>
          <span>由 {zone.creator.name} 发起</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              zone.status === "active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-ink-100 text-ink-600"
            }`}
          >
            {zone.status === "active" ? "进行中" : "召集中"}
          </span>
        </div>
      </header>

      <Card className="mt-4 p-4">
        <div className="text-xs font-medium text-ink-500">想讨论的问题</div>
        <p className="mt-1 text-sm text-ink-800">{zone.question}</p>
        {fromJson<string[]>(zone.tags, []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {fromJson<string[]>(zone.tags, []).map((t) => (
              <span
                key={t}
                className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          已加入 · {zone.members.length} 人
        </h2>
        <ul className="space-y-2">
          {zone.members.map((m) => {
            const p = m.user.profiles[0];
            return (
              <li key={m.id}>
                <Card className="p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm font-medium text-ink-900">
                      {m.user.name}
                      {p?.company && (
                        <span className="ml-2 text-xs font-normal text-ink-500">
                          {p.company}
                        </span>
                      )}
                    </div>
                    {m.arrived && (
                      <span className="text-[10px] text-emerald-600">已到 ✓</span>
                    )}
                  </div>
                  {p?.currentFocus && (
                    <div className="mt-1 text-xs text-ink-700">{p.currentFocus}</div>
                  )}
                  {p?.currentChallenge && (
                    <div className="mt-1 text-xs italic text-accent-600">
                      🤔 {p.currentChallenge}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8">
        <JoinControls
          zoneId={zone.id}
          eventId={zone.eventId}
          slotName={zone.zoneSlot.name}
          isMember={!!myMembership}
          arrived={!!myMembership?.arrived}
          signedIn={!!me}
        />
      </div>
    </main>
  );
}
