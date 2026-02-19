import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult } from "@shared/schema";

// NOTE: intentionally no module-level instance — we create one per-request so
// the key is always read fresh from process.env (useful after restarts).

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function sentimentWord(score: number): string {
  if (score >= 0.6) return "very positive";
  if (score >= 0.35) return "positive";
  if (score >= -0.1) return "neutral";
  if (score >= -0.4) return "negative";
  return "very negative";
}

export function buildSystemPrompt(analysis: AnalysisResult): string {  // ── Speaker summary ──────────────────────────────────────────────────────────
  const speakerSummary = analysis.speakerStats
    .map((s, i) => {
      const talkSecs = Math.round(s.total_talk_time_ms / 1000);
      return `  Speaker ${i + 1} (${s.speaker_id}): ${talkSecs}s talk time, ${s.turn_count} turns, avg sentiment ${s.avg_sentiment.toFixed(3)} (${sentimentWord(s.avg_sentiment)})`;
    })
    .join("\n");

  // ── Full transcript ───────────────────────────────────────────────────────────
  const transcript = analysis.utterances
    .slice()
    .sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0))
    .map((u) => {
      const spIdx = analysis.speakerStats.findIndex((s) => s.speaker_id === u.speaker_id);
      const label = spIdx >= 0 ? `Speaker ${spIdx + 1}` : u.speaker_id;
      const sentiment = u.sentiment_score !== undefined
        ? ` [sentiment: ${u.sentiment_score >= 0 ? "+" : ""}${u.sentiment_score.toFixed(3)}, ${sentimentWord(u.sentiment_score)}]`
        : "";
      return `[${fmt(u.start_ms ?? 0)}] ${label}: ${u.text}${sentiment}`;
    })
    .join("\n");

  // ── Insights ─────────────────────────────────────────────────────────────────
  const insights = analysis.insights.length > 0
    ? analysis.insights
        .map((ins) => `  [${fmt(ins.timestamp)}] ${ins.type.toUpperCase()} (severity ${ins.severity.toFixed(2)}): ${ins.description}`)
        .join("\n")
    : "  None detected.";

  // ── Topics ───────────────────────────────────────────────────────────────────
  const topics = analysis.topics && analysis.topics.length > 0
    ? analysis.topics.map((t) => `  ${t.topic} (confidence ${(t.confidence * 100).toFixed(0)}%)`).join("\n")
    : "  Not available.";

  // ── Intents ──────────────────────────────────────────────────────────────────
  const intents = analysis.intents && analysis.intents.length > 0
    ? analysis.intents.map((i) => `  ${i.intent} (confidence ${(i.confidence * 100).toFixed(0)}%)`).join("\n")
    : "  Not available.";

  // ── Summary ──────────────────────────────────────────────────────────────────
  const summary = analysis.summary ?? "Not available.";

  return `You are an expert conversation analyst embedded in an emotional intelligence dashboard. The user has analyzed an audio recording and wants to ask questions about it.

You have the full transcript with per-utterance sentiment scores, speaker statistics, and AI-generated insights below. Answer questions accurately and concisely. When referencing specific moments cite their [MM:SS] timestamp. Explain sentiment scores in plain language (scale: -1.0 = very negative, 0.0 = neutral, +1.0 = very positive). If something is not in the data, say so clearly.

=== CONVERSATION OVERVIEW ===
Speakers: ${analysis.speakerStats.length}
Total utterances: ${analysis.utterances.length}
Summary: ${summary}

=== SPEAKER STATISTICS ===
${speakerSummary}

=== TOPICS ===
${topics}

=== INTENTS ===
${intents}

=== KEY INSIGHTS ===
${insights}

=== FULL TRANSCRIPT ===
${transcript}`;
}

export type ChatMessage = { role: "user" | "model"; content: string };

/**
 * Send one message to Gemini and return the full text response.
 * History must be the prior turns (not including the current userMessage).
 * The system prompt is embedded into the very first user turn so Gemini
 * always receives context, regardless of API version behaviour.
 */
export async function chat(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Strip leading model turns — Gemini requires history to start with "user"
  let prior = history.filter((m) => m.content.trim() !== "");
  while (prior.length > 0 && prior[0].role !== "user") {
    prior = prior.slice(1);
  }

  // Build the contents array.
  // On the very first message there is no prior history, so we embed the
  // system prompt directly into that first user turn.
  let contents: Array<{ role: string; parts: Array<{ text: string }> }>;

  if (prior.length === 0) {
    contents = [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userMessage}` }] },
    ];
  } else {
    // Prepend system prompt into the first prior user turn once
    const withSystem: ChatMessage[] = [
      { role: prior[0].role, content: `${systemPrompt}\n\n---\n\n${prior[0].content}` },
      ...prior.slice(1),
      { role: "user", content: userMessage },
    ];
    contents = withSystem.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
  });
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/**
 * Detect the type of conversation and generate the most useful structured
 * document for that type (meeting notes, interview summary, news report, etc.)
 */
export async function generateSummary(
  apiKey: string,
  analysis: AnalysisResult,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const transcript = analysis.utterances
    .slice()
    .sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0))
    .map((u) => {
      const spIdx = analysis.speakerStats.findIndex((s) => s.speaker_id === u.speaker_id);
      const label = spIdx >= 0 ? `Speaker ${spIdx + 1}` : u.speaker_id;
      return `[${fmt(u.start_ms ?? 0)}] ${label}: ${u.text}`;
    })
    .join("\n");

  const topics = analysis.topics?.map((t) => t.topic).join(", ") ?? "unknown";
  const summary = analysis.summary ?? "";

  const prompt = `You are an expert analyst. You have been given a transcript of a recorded audio conversation. Your job is to:

1. **Identify** what type of content this is (e.g. business meeting, job interview, sales call, lecture/presentation, news report, support call, casual conversation, debate, podcast, medical consultation, etc.).
2. **Generate the single most useful structured document** for that content type. Examples:
   - Business meeting → Meeting notes with agenda recap, key decisions, action items (owner + deadline if mentioned), open questions
   - Job interview → Candidate evaluation: strengths, concerns, key answers, recommendation
   - Sales call → Deal summary, pain points identified, objections raised, agreed next steps
   - Lecture/class → Study notes: topic outline, key concepts, definitions, takeaways
   - Support/customer call → Issue summary, resolution, follow-up required
   - News/media report → Structured article: headline, summary, key facts, quotes, context
   - Podcast/casual → Episode summary, main themes, notable moments, quotes
   - Debate → Positions taken by each side, strongest arguments, unresolved points
   - Medical consultation → Chief complaint, findings discussed, plan/recommendations
   - Default for anything else → Executive summary with key points, notable moments, and recommended actions

**Format rules:**
- Use clean Markdown (headers, bullet lists, bold for labels).
- Start with a small italicised line: *Content type detected: [type]*
- Be thorough but concise. Do not pad with filler.
- If speaker names are unknown, use "Speaker 1", "Speaker 2", etc.
- Cite timestamps like [02:15] where relevant.

**Data:**
Topics identified: ${topics}
Auto-generated summary: ${summary}
Number of speakers: ${analysis.speakerStats.length}

**Full transcript:**
${transcript}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
