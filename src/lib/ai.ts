// Pluggable AI provider.
//
//   AI_PROVIDER=stub        → offline stub (default if no key set)
//   AI_PROVIDER=anthropic   → real Claude (requires ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY)
//
// The Anthropic SDK accepts either form of credential — `authToken` ships as
// `Authorization: Bearer ...` (OAuth-style), `apiKey` ships as `x-api-key`.
// We pass through whichever the user provides.

import Anthropic from "@anthropic-ai/sdk";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ProfileFields = {
  currentFocus: string;
  currentChallenge: string;
  lookingFor: string;
  canOffer: string;
};

export interface AIProvider {
  nextProfileTurn(history: ChatTurn[]): Promise<
    | { kind: "ask"; question: string; fieldHint: keyof ProfileFields }
    | { kind: "summary"; fields: ProfileFields }
  >;
  matchReason(
    a: { focus?: string | null; lookingFor?: string | null; canOffer?: string | null; domains: string[] },
    b: { focus?: string | null; lookingFor?: string | null; canOffer?: string | null; domains: string[] }
  ): Promise<string>;
  embed(text: string): Promise<number[]>;
}

const QUESTIONS: { q: string; field: keyof ProfileFields }[] = [
  { q: "你最近一两周主要在搞什么？最好讲一件具体的事。", field: "currentFocus" },
  { q: "这件事现在最让你头疼的点是什么？", field: "currentChallenge" },
  { q: "今天来这个活动，最想认识什么样的人？", field: "lookingFor" },
  { q: "如果别人来找你，你最能帮上忙的是什么方向？", field: "canOffer" },
];

const FIELD_NAMES: (keyof ProfileFields)[] = [
  "currentFocus",
  "currentChallenge",
  "lookingFor",
  "canOffer",
];

// ----- Stub provider (offline fallback) -----

class StubProvider implements AIProvider {
  async nextProfileTurn(history: ChatTurn[]) {
    const userTurns = history.filter((t) => t.role === "user");
    const idx = userTurns.length;
    if (idx < QUESTIONS.length) {
      const last = userTurns[idx - 1]?.content ?? "";
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
    return hashEmbed(text);
  }
}

function snippet(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 14 ? t.slice(0, 14) + "…" : t;
}

function hashEmbed(text: string): number[] {
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

// ----- Anthropic provider (real LLM) -----

const CHAT_SYSTEM = `你是创业活动现场的画像采集助手。你的任务是用 4 个简短问题帮用户讲清楚 4 件事：
1. currentFocus —— 他/她最近在做的一件具体的事
2. currentChallenge —— 现在卡在哪
3. lookingFor —— 想认识什么样的人
4. canOffer —— 能帮别人什么

风格：口语化、像懂行的朋友。不要客套话，不要"很有意思"、"太棒了"。
关键：保留用户原话里的具体细节（公司名、产品名、地点、数字）。

你会逐轮收到对话历史。每一轮你必须返回 JSON：

如果用户回答里某个字段还没说清楚（太短、太抽象、含大词如"AI"/"创业"/"产品"但没具体内容），返回 {"kind":"ask","question":"<具体的追问>"} 来追问。最多追问 1 次每个字段。

否则按顺序问下一个还没问的问题：
- 用户回答 0 句 → 问 currentFocus
- 1 句具体回答 → 问 currentChallenge
- 2 句 → 问 lookingFor
- 3 句 → 问 canOffer
- 4 句具体回答都齐了 → 返回 {"kind":"summary","fields":{...}}，每个字段 30-60 字，**保留原话具体细节**，不要总结成"AI 创业者"之类的空话。

输出 JSON 时，"fields" 字段必须存在；"ask" 时其中字段填空字符串 ""，"summary" 时填具体内容。`;

const MATCH_REASON_SYSTEM = `你是创业活动里互相介绍朋友的人。
给定 A 和 B 的画像，写一句话给 A 看，告诉 TA 为什么应该跟 B 聊。

要求：
- 一句话，不超过 35 字
- **必须引用具体细节**（公司名、领域、阶段、做过的事），不要"领域相关"、"可能感兴趣"这种废话
- 像懂双方的朋友撞合介绍，不要算法腔
- 要双向受益感（B 也会想聊 A）

好例子：
- "你在调研日本出海合规，李彻刚帮另一家做完同样的落地。"
- "你想找海外投放高手，韩青的 AI 教育产品就在这条线上踩坑。"

坏例子：
- "你们都在 AI 这条线上。"
- "可能可以聊聊。"

只输出那一句话，不要额外解释、不要前缀、不要引号。`;

class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private chatModel = "claude-opus-4-7";
  private matchModel = "claude-opus-4-7";

  constructor() {
    const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = new Anthropic(
      authToken ? { authToken } : apiKey ? { apiKey } : {}
    );
  }

  async nextProfileTurn(history: ChatTurn[]) {
    const userTurns = history.filter((t) => t.role === "user").length;

    const resp = await this.client.messages.create({
      model: this.chatModel,
      max_tokens: 1024,
      output_config: {
        effort: userTurns >= 4 ? "medium" : "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "question", "fields"],
            properties: {
              kind: { type: "string", enum: ["ask", "summary"] },
              question: { type: "string" },
              fields: {
                type: "object",
                additionalProperties: false,
                required: FIELD_NAMES,
                properties: {
                  currentFocus: { type: "string" },
                  currentChallenge: { type: "string" },
                  lookingFor: { type: "string" },
                  canOffer: { type: "string" },
                },
              },
            },
          },
        },
      },
      system: [
        {
          type: "text",
          text: CHAT_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: history.length
        ? history.map((t) => ({ role: t.role, content: t.content }))
        : [{ role: "user", content: "（请开始第一个问题）" }],
    });

    const text =
      resp.content.find((b) => b.type === "text")?.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text) as
        | { kind: "ask"; question: string; fields: ProfileFields }
        | { kind: "summary"; question: string; fields: ProfileFields };

      if (parsed.kind === "summary") {
        return { kind: "summary" as const, fields: parsed.fields };
      }
      const idx = Math.min(userTurns, QUESTIONS.length - 1);
      return {
        kind: "ask" as const,
        question: parsed.question || QUESTIONS[idx].q,
        fieldHint: QUESTIONS[idx].field,
      };
    } catch {
      // Fallback: behave like the stub if the model emits malformed JSON
      // (shouldn't happen with structured outputs, but just in case).
      const idx = Math.min(userTurns, QUESTIONS.length - 1);
      if (userTurns >= QUESTIONS.length) {
        const turns = history.filter((t) => t.role === "user");
        const trim = (s: string) => (s.length > 80 ? s.slice(0, 80) + "…" : s);
        return {
          kind: "summary" as const,
          fields: {
            currentFocus: trim(turns[0]?.content ?? ""),
            currentChallenge: trim(turns[1]?.content ?? ""),
            lookingFor: trim(turns[2]?.content ?? ""),
            canOffer: trim(turns[3]?.content ?? ""),
          },
        };
      }
      return {
        kind: "ask" as const,
        question: QUESTIONS[idx].q,
        fieldHint: QUESTIONS[idx].field,
      };
    }
  }

  async matchReason(a: any, b: any) {
    const userMsg = `A 的画像：
- 在做：${a.focus ?? "—"}
- 想找的人：${a.lookingFor ?? "—"}
- 能帮的方向：${a.canOffer ?? "—"}
- 领域：${(a.domains ?? []).join(", ") || "—"}

B 的画像：
- 在做：${b.focus ?? "—"}
- 想找的人：${b.lookingFor ?? "—"}
- 能帮的方向：${b.canOffer ?? "—"}
- 领域：${(b.domains ?? []).join(", ") || "—"}

写一句话给 A 看，告诉 TA 为什么该跟 B 聊。`;

    const resp = await this.client.messages.create({
      model: this.matchModel,
      max_tokens: 256,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [
        {
          type: "text",
          text: MATCH_REASON_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMsg }],
    });

    const text =
      resp.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("")
        .trim()
        .replace(/^["「『]|["」』]$/g, "") ?? "";

    if (text.length < 4 || text.length > 80) {
      // Pathological output → fall back to a deterministic phrasing
      const aLook = (a.lookingFor ?? "").trim();
      const bOffer = (b.canOffer ?? "").trim();
      if (aLook && bOffer) return `你在找 ${snippet(aLook)}，TA 正好在做 ${snippet(bOffer)}。`;
      return "画像有不少重合点，值得当面聊一下。";
    }
    return text;
  }

  async embed(text: string) {
    // Anthropic doesn't ship an embedding API; keep the deterministic hash
    // embedding from the stub. matchReason carries the semantic weight.
    return hashEmbed(text);
  }
}

let cached: AIProvider | null = null;
export function ai(): AIProvider {
  if (cached) return cached;
  const explicit = process.env.AI_PROVIDER;
  const hasKey = !!(process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY);
  const useAnthropic = explicit === "anthropic" || (explicit !== "stub" && hasKey);
  cached = useAnthropic ? new AnthropicProvider() : new StubProvider();
  return cached;
}

export const PROFILE_QUESTIONS = QUESTIONS;
