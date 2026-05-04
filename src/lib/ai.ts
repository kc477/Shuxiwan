// Pluggable AI provider. The default `stub` runs offline and is good enough
// to drive the UI end-to-end during MVP. Swap AI_PROVIDER=anthropic|openai
// later and implement those branches.

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ProfileFields = {
  currentFocus: string;
  currentChallenge: string;
  lookingFor: string;
  canOffer: string;
};

export interface AIProvider {
  /** Drives the 4-question profile collection. Returns the next assistant
   *  utterance, or — when enough has been collected — a structured summary. */
  nextProfileTurn(history: ChatTurn[]): Promise<
    | { kind: "ask"; question: string; fieldHint: keyof ProfileFields }
    | { kind: "summary"; fields: ProfileFields }
  >;

  /** One-line, 30-char-max match reason from A's perspective, for B. */
  matchReason(
    a: { focus?: string | null; lookingFor?: string | null; canOffer?: string | null; domains: string[] },
    b: { focus?: string | null; lookingFor?: string | null; canOffer?: string | null; domains: string[] }
  ): Promise<string>;

  /** Cheap embedding for matching. Stub returns a hash-based bag-of-words. */
  embed(text: string): Promise<number[]>;
}

const QUESTIONS: { q: string; field: keyof ProfileFields }[] = [
  { q: "你最近一两周主要在搞什么？最好讲一件具体的事。", field: "currentFocus" },
  { q: "这件事现在最让你头疼的点是什么？", field: "currentChallenge" },
  { q: "今天来这个活动，最想认识什么样的人？", field: "lookingFor" },
  { q: "如果别人来找你，你最能帮上忙的是什么方向？", field: "canOffer" },
];

class StubProvider implements AIProvider {
  async nextProfileTurn(history: ChatTurn[]) {
    const userTurns = history.filter((t) => t.role === "user");
    const idx = userTurns.length;
    if (idx < QUESTIONS.length) {
      const last = userTurns[idx - 1]?.content ?? "";
      // Mild "specificity" check: too short → push back once.
      if (idx > 0 && last.trim().length < 10 && !history[history.length - 1]?.content.includes("具体")) {
        return {
          kind: "ask" as const,
          question: "能再具体一点吗？比如时间、对象、卡在哪一步。",
          fieldHint: QUESTIONS[idx - 1].field,
        };
      }
      return {
        kind: "ask" as const,
        question: QUESTIONS[idx].q,
        fieldHint: QUESTIONS[idx].field,
      };
    }
    // Summarize: take the matching user turns, trim to 60 chars.
    const trim = (s: string) => (s.length > 80 ? s.slice(0, 80) + "…" : s);
    return {
      kind: "summary" as const,
      fields: {
        currentFocus: trim(userTurns[0]?.content ?? ""),
        currentChallenge: trim(userTurns[1]?.content ?? ""),
        lookingFor: trim(userTurns[2]?.content ?? ""),
        canOffer: trim(userTurns[3]?.content ?? ""),
      },
    };
  }

  async matchReason(a: any, b: any) {
    // Pull a concrete-sounding bridge: prefer overlap of A's lookingFor with B's canOffer.
    const aLook = (a.lookingFor ?? "").trim();
    const bOffer = (b.canOffer ?? "").trim();
    const bFocus = (b.focus ?? "").trim();
    if (aLook && bOffer) return `你在找 ${snippet(aLook)}，TA 正好在做 ${snippet(bOffer)}。`;
    if (aLook && bFocus) return `你在找 ${snippet(aLook)}，TA 最近正搞 ${snippet(bFocus)}。`;
    const overlap = a.domains?.filter((d: string) => b.domains?.includes(d)) ?? [];
    if (overlap.length) return `你们都在 ${overlap.slice(0, 2).join("、")} 这条线上。`;
    return "画像有不少重合点，值得当面聊一下。";
  }

  async embed(text: string) {
    // Hash-based deterministic pseudo-embedding (32-d). NOT semantic — but
    // good enough to make matching tests stable in dev.
    const dim = 32;
    const v = new Array<number>(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      v[c % dim] += 1;
      v[(c * 7) % dim] += 0.5;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / norm);
  }
}

function snippet(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 14 ? t.slice(0, 14) + "…" : t;
}

let cached: AIProvider | null = null;
export function ai(): AIProvider {
  if (cached) return cached;
  // Future: switch on process.env.AI_PROVIDER for "anthropic" / "openai".
  cached = new StubProvider();
  return cached;
}

export const PROFILE_QUESTIONS = QUESTIONS;
