import { prisma, fromJson } from "@/lib/db";
import { ai } from "@/lib/ai";

type ProfileForMatch = {
  userId: string;
  focus: string | null;
  challenge: string | null;
  lookingFor: string | null;
  canOffer: string | null;
  domains: string[];
  stage: string | null;
  eventTopics: string[];
  embedding: number[] | null;
};

function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // both are unit-normalized in stub
}

const STAGE_ORDER = ["idea", "preSeed", "seed", "seriesAPlus", "profitable"];
function stageScore(a: string | null, b: string | null) {
  if (!a || !b) return 0.5;
  const ia = STAGE_ORDER.indexOf(a);
  const ib = STAGE_ORDER.indexOf(b);
  if (ia < 0 || ib < 0) return 0.5;
  // Same stage = 1, one apart = 0.7, two apart = 0.4, more = 0.2
  const d = Math.abs(ia - ib);
  return [1, 0.7, 0.4, 0.2, 0.1, 0.1][Math.min(d, 5)];
}

function jaccard(a: string[], b: string[]) {
  if (!a.length && !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter || 1);
}

export async function loadProfilesForEvent(eventId: string): Promise<ProfileForMatch[]> {
  const rows = await prisma.profile.findMany({
    where: { eventId, completed: true, isVisible: true },
  });
  return rows.map((p) => ({
    userId: p.userId,
    focus: p.currentFocus,
    challenge: p.currentChallenge,
    lookingFor: p.lookingFor,
    canOffer: p.canOffer,
    domains: fromJson<string[]>(p.domains, []),
    stage: p.stage,
    eventTopics: fromJson<string[]>(p.eventTopics, []),
    embedding: p.embedding ? fromJson<number[]>(p.embedding, null as any) : null,
  }));
}

export async function ensureEmbedding(eventId: string, userId: string) {
  const p = await prisma.profile.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (!p || p.embedding) return;
  const text = [p.currentFocus, p.currentChallenge, p.lookingFor, p.canOffer]
    .filter(Boolean)
    .join(" \n ");
  if (!text.trim()) return;
  const e = await ai().embed(text);
  await prisma.profile.update({
    where: { id: p.id },
    data: { embedding: JSON.stringify(e) },
  });
}

export type Recommendation = {
  userId: string;
  score: number;
  reason: string;
};

export async function recommendFor(
  eventId: string,
  userId: string,
  limit = 5
): Promise<Recommendation[]> {
  await ensureEmbedding(eventId, userId);
  const all = await loadProfilesForEvent(eventId);
  const me = all.find((p) => p.userId === userId);
  if (!me) return [];
  const others = all.filter((p) => p.userId !== userId);

  const scored = others.map((o) => {
    const dom = jaccard(me.domains, o.domains);
    const top = jaccard(me.eventTopics, o.eventTopics);
    const stg = stageScore(me.stage, o.stage);
    const sem =
      me.embedding && o.embedding ? Math.max(0, cosine(me.embedding, o.embedding)) : 0.4;
    // needs↔offers: rough text overlap heuristic.
    const need = textOverlap(me.lookingFor, o.canOffer) + textOverlap(o.lookingFor, me.canOffer);
    const score = 0.3 * dom + 0.15 * stg + 0.4 * Math.min(1, need / 2 + sem * 0.4) + 0.15 * top;
    return { profile: o, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  const reasons = await Promise.all(
    top.map((t) =>
      ai().matchReason(
        {
          focus: me.focus,
          lookingFor: me.lookingFor,
          canOffer: me.canOffer,
          domains: me.domains,
        },
        {
          focus: t.profile.focus,
          lookingFor: t.profile.lookingFor,
          canOffer: t.profile.canOffer,
          domains: t.profile.domains,
        }
      )
    )
  );

  return top.map((t, i) => ({
    userId: t.profile.userId,
    score: t.score,
    reason: reasons[i],
  }));
}

function textOverlap(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter++;
  return inter / Math.min(ta.size, tb.size);
}

function tokenize(s: string) {
  // crude bigram tokenizer for Chinese-mixed text
  const out = new Set<string>();
  const t = s.replace(/\s+/g, "");
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}
