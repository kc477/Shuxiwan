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
  lookingFor: string | null;
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-ink-900">
            {props.name}
            {props.company && (
              <span className="ml-2 text-xs font-normal text-ink-500">
                {props.company}
              </span>
            )}
          </div>
          {props.focus && (
            <div className="mt-1 text-xs text-ink-600">{props.focus}</div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">
        💡 {props.reason}
      </div>

      {props.domains.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {props.domains.map((d) => (
            <span key={d} className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600">
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
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
          <span className="text-xs text-emerald-700">
            🎉 双向匹配！刷新看「已匹配」。
          </span>
        )}
      </div>
    </Card>
  );
}
