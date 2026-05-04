import { prisma, fromJson } from "@/lib/db";
import { Card } from "@/components/ui";

export async function ActivityFeed({ eventId }: { eventId: string }) {
  const rows = await prisma.activityLog.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: true },
  });

  if (rows.length === 0) {
    return (
      <Card className="p-3 text-xs text-ink-500">
        现场还没动静，等第一个人来打破沉默。
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          现在正发生
        </span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.id} className="flex items-baseline gap-2 text-xs">
            <span className="text-ink-800">{format(row)}</span>
            <span className="ml-auto shrink-0 text-[10px] text-ink-400">
              {relTime(row.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function format(row: {
  user: { name: string };
  kind: string;
  payload: string;
}): string {
  const p = fromJson<Record<string, string>>(row.payload, {});
  const name = row.user.name;
  switch (row.kind) {
    case "joined_event":
      return `${name} 入场了`;
    case "completed_profile":
      return `${name} 填完了画像`;
    case "created_zone":
      return `${name} 发起了「${p.title ?? "新 zone"}」`;
    case "joined_zone":
      return `${name} 加入了「${p.title ?? "zone"}」`;
    case "matched":
      return `${name} 跟 ${p.otherName ?? "另一位"} 匹配上了 🎉`;
    default:
      return `${name} 做了点什么`;
  }
}

function relTime(d: Date): string {
  const now = Date.now();
  const ts = new Date(d).getTime();
  const sec = Math.max(0, Math.round((now - ts) / 1000));
  if (sec < 30) return "刚刚";
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.round(hr / 24);
  return `${day} 天前`;
}
