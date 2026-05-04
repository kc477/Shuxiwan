import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma, fromJson } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { recommendFor } from "@/lib/match";
import { RecCard } from "./rec-card";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();
  const me = await getCurrentUser();
  if (!me) redirect(`/events/${params.id}`);
  const myProfile = await prisma.profile.findUnique({
    where: { userId_eventId: { userId: me.id, eventId: event.id } },
  });
  if (!myProfile?.completed) redirect(`/events/${params.id}/profile`);

  const recs = await recommendFor(event.id, me.id, 5);
  const userMap = await prisma.user.findMany({
    where: { id: { in: recs.map((r) => r.userId) } },
    include: { profiles: { where: { eventId: event.id } } },
  });
  const byId = new Map(userMap.map((u) => [u.id, u]));

  // Existing matches and pending intents
  const intents = await prisma.matchIntent.findMany({
    where: { eventId: event.id, fromId: me.id },
  });
  const intentTargets = new Set(intents.map((i) => i.toId));

  const matches = await prisma.match.findMany({
    where: {
      eventId: event.id,
      OR: [{ userAId: me.id }, { userBId: me.id }],
    },
    include: { userA: true, userB: true },
  });

  return (
    <main className="px-5 pb-24 pt-8">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">值得见一面的人</h1>
        <p className="mt-1 text-xs text-ink-500">
          基于你的画像 + 在场人的画像挑出来的。点「想聊聊」对方不会立刻知道，等你们都点了才换微信。
        </p>
      </header>

      {matches.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            已匹配 · {matches.length}
          </h2>
          <ul className="space-y-3">
            {matches.map((m) => {
              const other = m.userAId === me.id ? m.userB : m.userA;
              const reason = m.userAId === me.id ? m.reasonForA : m.reasonForB;
              return (
                <li key={m.id}>
                  <Card className="border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-sm font-medium text-ink-900">{other.name}</div>
                    <div className="mt-0.5 text-xs text-ink-600">{reason}</div>
                    <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-ink-700">
                      微信号：
                      <span className="ml-1 font-mono">
                        {other.wechatId ?? "对方还没填微信号"}
                      </span>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          推荐 · {recs.length}
        </h2>
        {recs.length === 0 && (
          <Card className="p-4 text-sm text-ink-500">
            还没找到合适的人。可能现场画像填完的人还不多，过 30 分钟再回来看看。
          </Card>
        )}
        <ul className="space-y-3">
          {recs.map((r) => {
            const u = byId.get(r.userId);
            if (!u) return null;
            const p = u.profiles[0];
            return (
              <li key={r.userId}>
                <RecCard
                  eventId={event.id}
                  toUserId={r.userId}
                  name={u.name}
                  company={p?.company ?? null}
                  focus={p?.currentFocus ?? null}
                  lookingFor={p?.lookingFor ?? null}
                  domains={fromJson<string[]>(p?.domains ?? "[]", [])}
                  reason={r.reason}
                  alreadyExpressed={intentTargets.has(r.userId)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <BottomNav eventId={event.id} active="recs" />
    </main>
  );
}

function BottomNav({ eventId, active }: { eventId: string; active: string }) {
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-ink-100 bg-white/95 px-5 py-2 backdrop-blur">
      <div className="flex items-center justify-around text-xs">
        <Link
          href={`/events/${eventId}`}
          className={`flex flex-col items-center ${
            active === "grid" ? "text-ink-900" : "text-ink-500"
          }`}
        >
          <span>🗺️</span>
          <span className="mt-0.5">现场</span>
        </Link>
        <Link
          href={`/events/${eventId}/recommendations`}
          className={`flex flex-col items-center ${
            active === "recs" ? "text-ink-900" : "text-ink-500"
          }`}
        >
          <span>✨</span>
          <span className="mt-0.5">推荐</span>
        </Link>
        <Link
          href={`/events/${eventId}/recap`}
          className={`flex flex-col items-center ${
            active === "recap" ? "text-ink-900" : "text-ink-500"
          }`}
        >
          <span>📔</span>
          <span className="mt-0.5">回顾</span>
        </Link>
      </div>
    </nav>
  );
}
