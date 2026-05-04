import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startTime: "desc" },
    take: 30,
  });

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">主办方后台</h1>
        <Link href="/admin/events/new">
          <Button size="sm">+ 新活动</Button>
        </Link>
      </header>

      {events.length === 0 ? (
        <Card className="p-4 text-sm text-ink-500">还没有活动。点右上角创建一个。</Card>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/events/${e.id}/map`}>
                <Card className="p-4 transition-colors hover:border-ink-300">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-ink-900">{e.name}</div>
                      <div className="mt-0.5 text-xs text-ink-500">
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
                      {e.status}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href="/" className="text-xs text-ink-500 underline-offset-2 hover:underline">
          ← 回首页
        </Link>
      </div>
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
