import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: { in: ["live", "draft"] } },
    orderBy: { startTime: "asc" },
    take: 10,
  });

  return (
    <main className="px-5 pb-16 pt-12">
      <header className="mb-10">
        <div className="text-sm font-medium tracking-wide text-accent-600">Shuxiwan</div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink-900">
          把活动现场的人，
          <br />
          变成真正聊得起来的人。
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          创建画像 · 走进对的圈子 · 离开时多几个能继续聊的人。
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">最近的活动</h2>
          <Link
            href="/admin/events/new"
            className="text-xs font-medium text-ink-500 hover:text-ink-800"
          >
            我是主办方 →
          </Link>
        </div>

        {events.length === 0 ? (
          <Card className="p-5 text-sm text-ink-500">
            还没有活动。
            <Link className="ml-1 underline" href="/admin/events/new">
              创建一场
            </Link>
            ，或者运行 <code className="rounded bg-ink-100 px-1">pnpm db:seed</code>。
          </Card>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`}>
                  <Card className="p-4 transition-colors hover:border-ink-300">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-ink-900">{e.name}</div>
                        <div className="mt-1 text-xs text-ink-500">
                          {fmt(e.startTime)} · {e.locationName}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          e.status === "live"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-ink-100 text-ink-600"
                        }`}
                      >
                        {e.status === "live" ? "进行中" : "未开始"}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-ink-200 p-5">
        <div className="text-sm font-medium text-ink-700">想看一遍流程？</div>
        <p className="mt-1 text-xs text-ink-500">
          点上面任一活动，可作为参与者切身体验报名 → 画像 → grid → 匹配的全过程。
        </p>
        <div className="mt-3 flex gap-2">
          <Link href="/admin/events">
            <Button variant="outline" size="sm">
              主办方后台
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function fmt(d: Date) {
  return new Date(d).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
