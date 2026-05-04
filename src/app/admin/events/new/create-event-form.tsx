"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { createEvent } from "@/app/actions/events";

export function CreateEventForm() {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loc, setLoc] = useState("");
  const [topicsRaw, setTopicsRaw] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [pending, startT] = useTransition();

  const valid = name && start && end && loc;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Label>活动名</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Card>
      <Card className="p-4">
        <Label>开始时间</Label>
        <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </Card>
      <Card className="p-4">
        <Label>结束时间</Label>
        <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </Card>
      <Card className="p-4">
        <Label>地点</Label>
        <Input
          placeholder="比如：上海 · 静安寺 · WeWork"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
      </Card>
      <Card className="p-4">
        <Label>预设话题（用逗号分隔）</Label>
        <Textarea
          rows={2}
          placeholder="出海, AI Infra, 消费品牌, 早期投融资"
          value={topicsRaw}
          onChange={(e) => setTopicsRaw(e.target.value)}
        />
      </Card>
      <Card className="p-4">
        <Label>容量（可选）</Label>
        <Input
          type="number"
          placeholder="比如 80"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </Card>

      <Button
        size="lg"
        className="w-full"
        disabled={!valid || pending}
        onClick={() =>
          startT(async () => {
            await createEvent({
              name,
              startTime: new Date(start).toISOString(),
              endTime: new Date(end).toISOString(),
              locationName: loc,
              presetTopics: topicsRaw
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean),
              capacity: capacity ? Number(capacity) : undefined,
            });
          })
        }
      >
        {pending ? "创建中…" : "下一步：画现场地图"}
      </Button>
    </div>
  );
}
