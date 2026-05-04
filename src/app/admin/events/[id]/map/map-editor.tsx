"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { saveZoneSlots } from "@/app/actions/events";

type Slot = {
  id?: string;
  name: string;
  shape: { type: "rect"; x: number; y: number; w: number; h: number };
  capacityHint?: number;
  allowUserZone: boolean;
};

export function MapEditor({
  eventId,
  venueMapUrl,
  initialSlots,
}: {
  eventId: string;
  venueMapUrl: string | null;
  initialSlots: Slot[];
}) {
  const [slots, setSlots] = useState<Slot[]>(
    initialSlots.length
      ? initialSlots
      : [
          {
            name: "A 区 · 主会场",
            shape: { type: "rect", x: 0.1, y: 0.1, w: 0.4, h: 0.4 },
            allowUserZone: true,
          },
          {
            name: "B 区 · 茶歇台",
            shape: { type: "rect", x: 0.55, y: 0.15, w: 0.35, h: 0.3 },
            allowUserZone: true,
          },
          {
            name: "C 区 · 沙发",
            shape: { type: "rect", x: 0.2, y: 0.6, w: 0.3, h: 0.25 },
            allowUserZone: true,
          },
        ]
  );
  const [pending, start] = useTransition();
  const [imgUrl, setImgUrl] = useState<string | null>(venueMapUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setImgUrl(reader.result as string);
    reader.readAsDataURL(f);
    // NOTE: MVP — for now we just preview locally; persistent upload to a real
    // bucket is a follow-up. The DB column accepts a URL or data: URI.
  }

  function addSlot() {
    setSlots((s) => [
      ...s,
      {
        name: `区域 ${s.length + 1}`,
        shape: {
          type: "rect",
          x: 0.3,
          y: 0.4,
          w: 0.25,
          h: 0.2,
        },
        allowUserZone: true,
      },
    ]);
  }

  function update(i: number, patch: Partial<Slot>) {
    setSlots((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function updateShape(i: number, patch: Partial<Slot["shape"]>) {
    setSlots((s) =>
      s.map((x, idx) =>
        idx === i ? { ...x, shape: { ...x.shape, ...patch, type: "rect" } } : x
      )
    );
  }
  function remove(i: number) {
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <Label>场地图</Label>
        <div className="relative w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50 aspect-[4/3]">
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="venue" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-ink-400">
              点下方上传场地图（也可以不传）
            </div>
          )}
          {slots.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-md border-2 border-accent-500 bg-accent-500/20"
              style={{
                left: `${s.shape.x * 100}%`,
                top: `${s.shape.y * 100}%`,
                width: `${s.shape.w * 100}%`,
                height: `${s.shape.h * 100}%`,
              }}
            >
              <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-medium text-ink-800">
                {s.name}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            上传图片
          </Button>
          <span className="text-[11px] text-ink-400">
            预览本地有效；持久化要接对象存储（MVP 后续）
          </span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="mb-0">区域（{slots.length}）</Label>
          <Button variant="outline" size="sm" onClick={addSlot}>
            + 加一个
          </Button>
        </div>

        <div className="space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="rounded-xl border border-ink-200 p-3">
              <div className="flex items-center justify-between">
                <input
                  value={s.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-medium text-ink-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs text-ink-400 hover:text-red-600"
                >
                  删除
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                <NumField
                  label="x"
                  value={s.shape.x}
                  onChange={(v) => updateShape(i, { x: v })}
                />
                <NumField
                  label="y"
                  value={s.shape.y}
                  onChange={(v) => updateShape(i, { y: v })}
                />
                <NumField
                  label="w"
                  value={s.shape.w}
                  onChange={(v) => updateShape(i, { w: v })}
                />
                <NumField
                  label="h"
                  value={s.shape.h}
                  onChange={(v) => updateShape(i, { h: v })}
                />
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <Input
                  type="number"
                  className="w-24"
                  placeholder="容量"
                  value={s.capacityHint ?? ""}
                  onChange={(e) =>
                    update(i, {
                      capacityHint: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <label className="flex items-center gap-1 text-ink-600">
                  <input
                    type="checkbox"
                    checked={s.allowUserZone}
                    onChange={(e) => update(i, { allowUserZone: e.target.checked })}
                  />
                  允许用户发起 zone
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await saveZoneSlots({
              eventId,
              slots: slots.map((s) => ({
                id: s.id,
                name: s.name,
                shape: s.shape,
                capacityHint: s.capacityHint,
                allowUserZone: s.allowUserZone,
              })),
            });
          })
        }
      >
        {pending ? "保存中…" : "保存区域"}
      </Button>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] text-ink-500">{label}</span>
      <input
        type="number"
        step="0.05"
        min={0}
        max={1}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(1, Number(e.target.value))))}
        className="rounded border border-ink-200 bg-white px-1.5 py-1 text-xs"
      />
    </label>
  );
}
