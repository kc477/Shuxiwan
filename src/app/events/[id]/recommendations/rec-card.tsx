"use client";

import { useState, useTransition } from "react";
import { Button, Card } from "@/components/ui";
import { expressIntent, skipRecommendation } from "@/app/actions/match";

export function RecCard(props: {
  eventId: string;
  toUserId: string;
  name: string;
  company: string | null;
  focus: string | null;
  challenge: string | null;
  lookingFor: string | null;
  canOffer: string | null;
  domains: string[];
  reason: string;
  alreadyExpressed: boolean;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "sent" | "matched" | "skipped">(
    props.alreadyExpressed ? "sent" : "idle"
  );

  if (state === "skipped") return null;

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-base font-semibold text-ink-900">{props.name}</div>
        {props.company && (
          <div className="text-xs text-ink-500">{props.company}</div>
        )}
      </div>

      <div className="mt-3 rounded-xl bg-accent-50 px-3 py-2.5 text-xs text-ink-800">
        ✨ <span className="font-medium text-accent-600">为什么是 TA</span>
        <div className="mt-0.5 text-ink-700">{props.reason}</div>
      </div>

      <dl className="mt-4 space-y-2.5 text-xs">
        {props.focus && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
              最近在搞
            </dt>
            <dd className="mt-0.5 text-ink-800">{props.focus}</dd>
          </div>
        )}
        {props.challenge && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-accent-500">
              🤔 现在卡在
            </dt>
            <dd className="mt-0.5 italic text-ink-700">{props.challenge}</dd>
          </div>
        )}
        {props.lookingFor && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
              想找的人
            </dt>
            <dd className="mt-0.5 text-ink-700">{props.lookingFor}</dd>
          </div>
        )}
        {props.canOffer && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
              能帮上的
            </dt>
            <dd className="mt-0.5 text-ink-700">{props.canOffer}</dd>
          </div>
        )}
      </dl>

      {props.domains.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {props.domains.map((d) => (
            <span
              key={d}
              className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {state === "idle" && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await expressIntent(
                    props.eventId,
                    props.toUserId,
                    props.reason
                  );
                  setState(r.matched ? "matched" : "sent");
                })
              }
            >
              想聊聊
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await skipRecommendation(props.eventId, props.toUserId);
                  setState("skipped");
                })
              }
            >
              跳过
            </Button>
          </>
        )}
        {state === "sent" && (
          <span className="text-xs text-ink-500">
            ✓ 已表达兴趣，等对方也点你就匹配上。
          </span>
        )}
        {state === "matched" && (
          <span className="text-xs font-medium text-emerald-700">
            🎉 双向匹配！刷新看「已匹配」。
          </span>
        )}
      </div>
    </Card>
  );
}
