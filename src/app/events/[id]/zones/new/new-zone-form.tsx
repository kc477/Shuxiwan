"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { createZone } from "@/app/actions/zones";

export function NewZoneForm({
  eventId,
  slots,
  defaultSlotId,
  presetTopics,
}: {
  eventId: string;
  slots: { id: string; name: string }[];
  defaultSlotId?: string;
  presetTopics: string[];
}) {
  const [slotId, setSlotId] = useState(defaultSlotId ?? slots[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const valid = slotId && title.trim().length >= 2 && question.trim().length >= 2;

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <Label>在哪里见</Label>
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlotId(s.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                slotId === s.id
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-700"
              }`}
            >
              📍 {s.name}
            </button>
          ))}
          {slots.length === 0 && (
            <span className="text-xs text-ink-500">主办方还没划分区域。</span>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <Label>一句话主题（≤ 30 字）</Label>
        <Input
          maxLength={30}
          placeholder="比如：一起聊聊出海日本的合规怎么搞"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Card>

      <Card className="p-4">
        <Label>你想讨论的具体问题（≤ 120 字）</Label>
        <Textarea
          rows={3}
          maxLength={120}
          placeholder="越具体越容易招到人。比如：我们准备 2026 上半年进日本，正在评估 DPA / GDPR 类似的合规要求，想找做过的人聊聊"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Card>

      {presetTopics.length > 0 && (
        <Card className="p-4">
          <Label>话题标签（最多 3 个）</Label>
          <div className="flex flex-wrap gap-2">
            {presetTopics.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (on) setTags(tags.filter((x) => x !== t));
                    else if (tags.length < 3) setTags([...tags, t]);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    on
                      ? "border-accent-500 bg-accent-100 text-accent-600"
                      : "border-ink-200 text-ink-700"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!valid || pending}
        onClick={() =>
          start(async () => {
            await createZone({ eventId, zoneSlotId: slotId, title, question, tags });
          })
        }
      >
        {pending ? "创建中…" : "发起 zone"}
      </Button>
    </div>
  );
}
