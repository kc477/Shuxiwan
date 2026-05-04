"use client";

import { useState } from "react";
import Link from "next/link";

type Slot = {
  id: string;
  name: string;
  shape: { type: string; x: number; y: number; w: number; h: number };
  capacityHint?: number | null;
};

type Zone = { id: string; zoneSlotId: string; title: string; status: string };

export function GridMap({
  event,
  zonesBySlot,
}: {
  event: { id: string; venueMapUrl: string | null; zoneSlots: Slot[] };
  zonesBySlot: Record<string, Zone[]>;
}) {
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  const aspect = "aspect-[4/3]";
  return (
    <div className="space-y-3">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 ${aspect}`}
      >
        {event.venueMapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.venueMapUrl}
            alt="venue"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-ink-400">
            主办方还没上传场地图
          </div>
        )}
        {event.zoneSlots.map((s) => {
          const count = zonesBySlot[s.id]?.length ?? 0;
          const intensity = Math.min(1, count / 4);
          return (
            <button
              key={s.id}
              onClick={() => setOpenSlot(s.id === openSlot ? null : s.id)}
              className="absolute rounded-md border border-accent-500/60 transition-all hover:scale-[1.02]"
              style={{
                left: `${s.shape.x * 100}%`,
                top: `${s.shape.y * 100}%`,
                width: `${s.shape.w * 100}%`,
                height: `${s.shape.h * 100}%`,
                background: `rgba(249, 115, 22, ${0.12 + intensity * 0.4})`,
              }}
            >
              <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-medium text-ink-800">
                {s.name} · {count}
              </span>
            </button>
          );
        })}
      </div>

      {openSlot && (
        <SlotPanel
          eventId={event.id}
          slot={event.zoneSlots.find((s) => s.id === openSlot)!}
          zones={zonesBySlot[openSlot] ?? []}
        />
      )}
    </div>
  );
}

function SlotPanel({
  eventId,
  slot,
  zones,
}: {
  eventId: string;
  slot: Slot;
  zones: Zone[];
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink-900">{slot.name}</div>
          {slot.capacityHint && (
            <div className="text-xs text-ink-400">建议容纳 ~ {slot.capacityHint} 人</div>
          )}
        </div>
        <Link
          href={`/events/${eventId}/zones/new?slotId=${slot.id}`}
          className="text-xs font-medium text-accent-600"
        >
          + 在这里发起
        </Link>
      </div>
      {zones.length === 0 ? (
        <div className="mt-3 text-xs text-ink-500">这个区域还没人发起 zone。</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {zones.map((z) => (
            <li key={z.id}>
              <Link
                href={`/events/${eventId}/zones/${z.id}`}
                className="block rounded-lg bg-ink-50 px-3 py-2 text-sm transition-colors hover:bg-ink-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-800">{z.title}</span>
                  <span className="text-[10px] text-ink-500">
                    {z.status === "active" ? "进行中" : "召集中"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
