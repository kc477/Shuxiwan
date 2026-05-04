import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForGrid } from "@/app/actions/events";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Button, Card } from "@/components/ui";
import { GridMap } from "./grid-map";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEventForGrid(params.id);
  if (!event) notFound();

  const me = await getCurrentUser();
  const myProfile = me
    ? await prisma.profile.findUnique({
        where: { userId_eventId: { userId: me.id, eventId: event.id } },
      })
    : null;
  const profileComplete = !!myProfile?.completed;

  const totalParticipants = await prisma.eventParticipant.count({
    where: { eventId: event.id },
  });

  // Group zones by slot for the side list.
  const zonesBySlot = new Map<string, typeof event.zones>();
  for (const z of event.zones) {
    const arr = zonesBySlot.get(z.zoneSlotId) ?? [];
    arr.push(z);
    zonesBySlot.set(z.zoneSlotId, arr);
  }

  return (
    <main className="pb-24">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/85 px-5 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-500">{event.locationName}</div>
            <div className="font-semibold text-ink-900">{event.name}</div>
          </div>
          <div className="text-xs text-ink-500">
            <div>在场 {totalParticipants}</div>
            <div>{event.zones.length} 个 zone</div>
          </div>
        </div>
      </header>

      {!me && (
        <div className="px-5 pt-5">
          <Card className="p-4">
            <div className="text-sm font-medium text-ink-800">先告诉系统你是谁</div>
            <p className="mt-1 text-xs text-ink-500">
              这样 grid 才能给你推荐 zone 和合适的人。30 秒就好。
            </p>
            <form
              action={async (fd: FormData) => {
                "use server";
                const { quickSignIn } = await import("@/app/actions/auth");
                fd.append("eventId", event.id);
                await quickSignIn(fd);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                name="name"
                placeholder="你的名字"
                className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-ink-400"
                required
              />
              <Button type="submit">入场</Button>
            </form>
          </Card>
        </div>
      )}

      {me && !profileComplete && (
        <div className="px-5 pt-5">
          <Card className="border-accent-100 bg-accent-50 p-4">
            <div className="text-sm font-medium text-accent-600">画像还没填完</div>
            <p className="mt-1 text-xs text-ink-600">
              填完后系统才能给你推荐 zone 和能聊得起来的人。
            </p>
            <Link href={`/events/${event.id}/profile`}>
              <Button size="sm" className="mt-3">
                继续填画像
              </Button>
            </Link>
          </Card>
        </div>
      )}

      <section className="px-5 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">现场地图</h2>
          <span className="text-xs text-ink-400">点区域查看 zone</span>
        </div>
        <GridMap event={event} zonesBySlot={Object.fromEntries(zonesBySlot)} />
      </section>

      <section className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">所有 zone</h2>
          {profileComplete && event.zoneSlots.length > 0 && (
            <Link
              href={`/events/${event.id}/zones/new`}
              className="text-xs font-medium text-accent-600"
            >
              + 我来发起一个
            </Link>
          )}
        </div>
        {event.zones.length === 0 ? (
          <Card className="p-4 text-sm text-ink-500">
            还没人发起 zone。如果你心里有个想聊的话题，
            <Link
              href={`/events/${event.id}/zones/new`}
              className="ml-1 font-medium text-accent-600"
            >
              第一个开口的人最酷
            </Link>
            。
          </Card>
        ) : (
          <ul className="space-y-3">
            {event.zones.map((z) => {
              const slot = event.zoneSlots.find((s) => s.id === z.zoneSlotId);
              return (
                <li key={z.id}>
                  <Link href={`/events/${event.id}/zones/${z.id}`}>
                    <Card className="p-4 transition-colors hover:border-ink-300">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-ink-900">{z.title}</div>
                          <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">
                            {z.question}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                            <span>📍 {slot?.name ?? "—"}</span>
                            <span>·</span>
                            <span>{z.members.length} 人</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${
                                z.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-ink-100 text-ink-600"
                              }`}
                            >
                              {z.status === "active" ? "进行中" : "召集中"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-ink-100 bg-white/95 px-5 py-2 backdrop-blur">
        <div className="flex items-center justify-around text-xs">
          <Link href={`/events/${event.id}`} className="flex flex-col items-center text-ink-900">
            <span>🗺️</span>
            <span className="mt-0.5">现场</span>
          </Link>
          <Link
            href={`/events/${event.id}/recommendations`}
            className="flex flex-col items-center text-ink-500 hover:text-ink-900"
          >
            <span>✨</span>
            <span className="mt-0.5">推荐</span>
          </Link>
          <Link
            href={`/events/${event.id}/recap`}
            className="flex flex-col items-center text-ink-500 hover:text-ink-900"
          >
            <span>📔</span>
            <span className="mt-0.5">回顾</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
