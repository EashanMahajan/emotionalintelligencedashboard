import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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

export function buildSystemPrompt(analysis: AnalysisResult): string {
  const speakerCount = analysis.speakerStats.length;

  // ── Speaker summary ──────────────────────────────────────────────────────────
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

  return `You are an expert conversation analyst embedded in an emotional intelligence dashboard. \
The user has just analyzed an audio recording and wants to ask questions about it.

You have access to the full transcript, sentiment scores, speaker statistics, and AI-generated insights. \
Answer questions accurately and concisely. When referencing specific moments, include their timestamps in [MM:SS] format. \
When discussing sentiment, explain what the numbers mean in plain language. \
If asked about something not in the data, say so clearly rather than guessing.

────────────────────────────────────
CONVERSATION OVERVIEW
────────────────────────────────────
Number of speakers: ${speakerCount}
Total utterances: ${analysis.utterances.length}
Summary: ${summary}

────────────────────────────────────
SPEAKER STATISTICS
────────────────────────────────────
${speakerSummary}

────────────────────────────────────
TOPICS DETECTED
────────────────────────────────────
${topics}

────────────────────────────────────
INTENTS DETECTED
────────────────────────────────────
${intents}

────────────────────────────────────
KEY INSIGHTS
────────────────────────────────────
${insights}

────────────────────────────────────
FULL TRANSCRIPT (with sentiment scores)
Sentiment scale: -1.0 = very negative, 0.0 = neutral, +1.0 = very positive
────────────────────────────────────
${transcript}

────────────────────────────────────
You are ready to answer questions about this conversation.`;
}

export type ChatMessage = { role: "user" | "model"; content: string };

export async function streamChat(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  onChunk: (text: string) => void
): Promise<void> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  // Gemini requires history to start with a user turn and alternate user/model.
  // Strip any leading model messages (e.g. synthetic UI greetings).
  let cleanHistory = [...history];
  while (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
    cleanHistory.shift();
  }

  const chat = model.startChat({
    history: cleanHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessageStream(userMessage);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) onChunk(text);
  }
}
