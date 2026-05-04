"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { saveProfileBasics } from "@/app/actions/profile";

const ROLES = [
  ["founder", "创始人"],
  ["partner", "合伙人"],
  ["earlyEmployee", "早期员工"],
  ["investor", "投资人"],
  ["other", "其他"],
];
const STAGES = [
  ["idea", "想法"],
  ["preSeed", "Pre-seed"],
  ["seed", "Seed"],
  ["seriesAPlus", "A轮+"],
  ["profitable", "已盈利"],
];
const DOMAINS = ["AI", "消费", "出海", "企服", "硬件", "医疗", "教育", "金融", "内容"];

type Initial = {
  company: string;
  role: string;
  stage: string;
  domains: string[];
  eventTopics: string[];
};

export function ProfileForm({
  eventId,
  presetTopics,
  initial,
}: {
  eventId: string;
  presetTopics: string[];
  initial: Initial | null | undefined;
}) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [stage, setStage] = useState(initial?.stage ?? "");
  const [domains, setDomains] = useState<string[]>(initial?.domains ?? []);
  const [topics, setTopics] = useState<string[]>(initial?.eventTopics ?? []);
  const [pending, start] = useTransition();

  const toggle = (s: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);

  const valid = !!role && !!stage && domains.length > 0;

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <Label>公司 / 项目</Label>
        <Input
          placeholder="可以留空"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </Card>

      <Card className="p-4">
        <Label>你是？</Label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setRole(k)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                role === k
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Label>所处阶段</Label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setStage(k)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                stage === k
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Label>领域（至少一个，可多选）</Label>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d, domains, setDomains)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                domains.includes(d)
                  ? "border-accent-500 bg-accent-100 text-accent-600"
                  : "border-ink-200 text-ink-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Card>

      {presetTopics.length > 0 && (
        <Card className="p-4">
          <Label>本场你最关心的话题（可选）</Label>
          <div className="flex flex-wrap gap-2">
            {presetTopics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t, topics, setTopics)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  topics.includes(t)
                    ? "border-accent-500 bg-accent-100 text-accent-600"
                    : "border-ink-200 text-ink-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Button
        disabled={!valid || pending}
        size="lg"
        className="w-full"
        onClick={() =>
          start(async () => {
            await saveProfileBasics({
              eventId,
              company,
              role,
              stage,
              domains,
              eventTopics: topics,
            });
          })
        }
      >
        {pending ? "保存中…" : "下一步：跟 AI 聊 90 秒"}
      </Button>
    </div>
  );
}
