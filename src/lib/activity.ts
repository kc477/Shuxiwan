import { prisma, toJson } from "@/lib/db";

// Best-effort activity logger. Never throws — if logging fails (e.g. user
// doesn't exist yet), the surrounding action still succeeds.
export async function logActivity(
  eventId: string,
  userId: string,
  kind:
    | "joined_event"
    | "completed_profile"
    | "created_zone"
    | "joined_zone"
    | "matched",
  payload: Record<string, unknown> = {}
) {
  try {
    await prisma.activityLog.create({
      data: { eventId, userId, kind, payload: toJson(payload) },
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[activity] log failed:", e);
    }
  }
}
