import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RecapPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();
  const me = await getCurrentUser();
  if (!me) redirect(`/events/${params.id}`);

  const myZones = await prisma.zoneMember.findMany({
    where: { userId: me.id, zone: { eventId: event.id } },
    include: {
      zone: {
        include: {
          members: { where: { leftAt: null }, include: { user: true } },
          zoneSlot: true,
        },
      },
    },
  });

  const matches = await prisma.match.findMany({
    where: {
      eventId: event.id,
      OR: [{ userAId: me.id }, { userBId: me.id }],
    },
    include: { userA: true, userB: true },
  });

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-6">
        <div className="text-xs text-ink-500">{event.name} · 回顾</div>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">
          {matches.length === 0 && myZones.length === 0
            ? "你这次比较安静呀"
            : "今天的人，别忘记"}
        </h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          双向匹配 · {matches.length}
        </h2>
        {matches.length === 0 ? (
          <Card className="p-4 text-sm text-ink-500">
            还没匹配上人。可以回到推荐页继续点几个，下一场活动也许就遇上了。
          </Card>
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => {
              const other = m.userAId === me.id ? m.userB : m.userA;
              const reason = m.userAId === me.id ? m.reasonForA : m.reasonForB;
              return (
                <li key={m.id}>
                  <Card className="p-4">
                    <div className="text-sm font-medium text-ink-900">{other.name}</div>
                    <div className="mt-0.5 text-xs text-ink-600">{reason}</div>
                    <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">
                      <div>微信号：{other.wechatId ?? "—"}</div>
                      <div className="mt-1.5 text-[11px] text-ink-500">
                        建议本周内主动 follow up 一句：「今天聊得太短，回头继续」。
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          今天去过的 zone · {myZones.length}
        </h2>
        {myZones.length === 0 ? (
          <Card className="p-4 text-sm text-ink-500">没加入 zone。下次试试。</Card>
        ) : (
          <ul className="space-y-3">
            {myZones.map((zm) => (
              <li key={zm.id}>
                <Card className="p-4">
                  <div className="text-sm font-medium text-ink-900">{zm.zone.title}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    📍 {zm.zone.zoneSlot.name} · 同 zone {zm.zone.members.length} 人
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {zm.zone.members
                      .filter((mm) => mm.userId !== me.id)
                      .map((mm) => (
                        <span
                          key={mm.id}
                          className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-700"
                        >
                          {mm.user.name}
                        </span>
                      ))}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 text-center">
        <Link
          href={`/events/${event.id}`}
          className="text-xs text-ink-500 underline-offset-2 hover:underline"
        >
          回到现场
        </Link>
      </div>
    </main>
  );
}
