"use client";

import { useTransition } from "react";
import { Button, Card } from "@/components/ui";
import { joinZone, leaveZone, markArrived } from "@/app/actions/zones";

export function JoinControls({
  zoneId,
  eventId,
  slotName,
  isMember,
  arrived,
  signedIn,
}: {
  zoneId: string;
  eventId: string;
  slotName: string;
  isMember: boolean;
  arrived: boolean;
  signedIn: boolean;
}) {
  const [pending, start] = useTransition();
  void eventId;

  if (!signedIn) {
    return (
      <Card className="p-4 text-sm text-ink-500">
        要先入场才能加入 zone。
      </Card>
    );
  }

  if (!isMember) {
    return (
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => start(() => joinZone(zoneId))}
      >
        {pending ? "加入中…" : "我去"}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="border-accent-200 bg-accent-50 p-4">
        <div className="text-sm font-medium text-accent-600">
          📍 现在去「{slotName}」
        </div>
        <p className="mt-1 text-xs text-ink-600">
          到了就点一下「我到了」，让其他人知道。
        </p>
        {!arrived && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={pending}
            onClick={() => start(() => markArrived(zoneId))}
          >
            我到了
          </Button>
        )}
        {arrived && (
          <span className="mt-3 inline-block text-xs text-emerald-600">已签到 ✓</span>
        )}
      </Card>
      <button
        onClick={() => start(() => leaveZone(zoneId))}
        disabled={pending}
        className="w-full text-xs text-ink-400 underline-offset-2 hover:underline"
      >
        离开
      </button>
    </div>
  );
}
