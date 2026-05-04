"use client";

import { useState, useTransition } from "react";
import { Button, Card, Textarea } from "@/components/ui";
import { chatStep, saveProfileSoft } from "@/app/actions/profile";
import type { ChatTurn, ProfileFields } from "@/lib/ai";

export function ChatFlow({
  eventId,
  firstQuestion,
}: {
  eventId: string;
  firstQuestion: string;
}) {
  const [history, setHistory] = useState<ChatTurn[]>([
    { role: "assistant", content: firstQuestion },
  ]);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const [summary, setSummary] = useState<ProfileFields | null>(null);

  function send() {
    if (!draft.trim()) return;
    const userTurn: ChatTurn = { role: "user", content: draft.trim() };
    const next = [...history, userTurn];
    setHistory(next);
    setDraft("");
    start(async () => {
      const res = await chatStep(eventId, next);
      if (res.kind === "ask") {
        setHistory((h) => [...h, { role: "assistant", content: res.question }]);
      } else {
        setSummary(res.fields);
      }
    });
  }

  if (summary) {
    return <SummaryEditor eventId={eventId} initial={summary} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 pb-4">
        {history.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                t.role === "user"
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-800 shadow-sm border border-ink-100"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="text-xs text-ink-400">AI 正在听…</div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-ink-100 bg-white px-5 py-3">
        <Textarea
          rows={2}
          placeholder="可以语音也可以打字（MVP 暂只支持打字）"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-ink-400">⌘/Ctrl + Enter 发送</span>
          <Button onClick={send} disabled={pending || !draft.trim()}>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryEditor({
  eventId,
  initial,
}: {
  eventId: string;
  initial: ProfileFields;
}) {
  const [f, setF] = useState<ProfileFields>(initial);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-ink-500">
        我理解你的意思是这样，对吗？任何字段都可以改。
      </p>
      <FieldRow label="最近在搞什么" value={f.currentFocus} onChange={(v) => setF({ ...f, currentFocus: v })} />
      <FieldRow label="现在卡在哪" value={f.currentChallenge} onChange={(v) => setF({ ...f, currentChallenge: v })} />
      <FieldRow label="想认识什么样的人" value={f.lookingFor} onChange={(v) => setF({ ...f, lookingFor: v })} />
      <FieldRow label="能帮别人什么" value={f.canOffer} onChange={(v) => setF({ ...f, canOffer: v })} />
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await saveProfileSoft(eventId, f);
          })
        }
      >
        {pending ? "保存中…" : "确认，进入现场"}
      </Button>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="p-3">
      <div className="mb-1 text-[11px] font-medium text-ink-500">{label}</div>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </Card>
  );
}
