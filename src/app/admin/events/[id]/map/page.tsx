import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, fromJson } from "@/lib/db";
import { MapEditor } from "./map-editor";

export const dynamic = "force-dynamic";

export default async function EventMapPage({ params }: { params: { id: string } }) {
  const e = await prisma.event.findUnique({
    where: { id: params.id },
    include: { zoneSlots: true },
  });
  if (!e) notFound();

  return (
    <main className="px-5 pb-16 pt-8">
      <header className="mb-5">
        <div className="text-xs text-ink-500">{e.name}</div>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">现场地图 + 区域</h1>
        <p className="mt-1 text-xs text-ink-500">
          上传场地图（可选），然后拖出几个区域。每个区域参与者都可以在那里发起 zone。
        </p>
      </header>

      <MapEditor
        eventId={e.id}
        venueMapUrl={e.venueMapUrl}
        initialSlots={e.zoneSlots.map((s) => ({
          id: s.id,
          name: s.name,
          shape: fromJson<{ type: "rect"; x: number; y: number; w: number; h: number }>(
            s.shape,
            { type: "rect", x: 0, y: 0, w: 0.2, h: 0.2 }
          ),
          capacityHint: s.capacityHint ?? undefined,
          allowUserZone: s.allowUserZone,
        }))}
      />

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/admin/events`}
          className="text-xs text-ink-500 underline-offset-2 hover:underline"
        >
          ← 返回列表
        </Link>
        <PublishButton eventId={e.id} status={e.status} />
      </div>
    </main>
  );
}

function PublishButton({ eventId, status }: { eventId: string; status: string }) {
  if (status === "live")
    return (
      <Link
        href={`/events/${eventId}`}
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
      >
        看参与者视图 →
      </Link>
    );
  return (
    <form
      action={async () => {
        "use server";
        const { publishEvent } = await import("@/app/actions/events");
        await publishEvent(eventId);
      }}
    >
      <button className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white">
        发布活动
      </button>
    </form>
  );
}
