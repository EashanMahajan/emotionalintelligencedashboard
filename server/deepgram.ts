import type { AnalysisResult, Insight, Utterance, TopicSegment, IntentSegment } from "@shared/schema";

const DEFAULT_MODEL = "nova-3";

type DeepgramResponse = any;

type DeepgramInput = {
  buffer: Buffer;
  mimetype: string;
  filename?: string;
};

type SentimentSegment = {
  start: number;
  end: number;
  sentiment?: string;
  confidence?: number;
};

const sentimentScoreMap: Record<string, number> = {
  positive: 0.6,
  neutral: 0,
  negative: -0.6,
};

function toMs(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return 0;
  }
  return Math.round(seconds * 1000);
}

function getApiKey() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is required to analyze audio.");
  }
  return apiKey;
}

async function callDeepgram(path: "listen" | "analyze", params: URLSearchParams, input: DeepgramInput) {
  const apiKey = getApiKey();
  const url = new URL(`https://api.deepgram.com/v1/${path}`);
  url.search = params.toString();

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": input.mimetype || "application/octet-stream",
    },
    body: input.buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Deepgram ${path} failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

function collectSentiments(response: DeepgramResponse): SentimentSegment[] {
  const alt = response?.results?.channels?.[0]?.alternatives?.[0];
  const segments = alt?.sentiments || response?.results?.sentiments || [];
  if (!Array.isArray(segments)) {
    return [];
  }
  return segments.map((segment: any) => ({
    start: segment.start ?? 0,
    end: segment.end ?? 0,
    sentiment: segment.sentiment,
    confidence: segment.confidence,
  }));
}

function sentimentToScore(sentiment?: string, confidence?: number) {
  const base = sentiment ? sentimentScoreMap[sentiment] ?? 0 : 0;
  const weight = typeof confidence === "number" ? Math.min(1, Math.max(0, confidence)) : 1;
  return base * weight;
}

function scoreUtterance(utterance: Utterance, segments: SentimentSegment[]) {
  if (!segments.length) {
    return 0;
  }
  const start = utterance.start_ms;
  const end = utterance.end_ms;
  let weightedSum = 0;
  let totalMs = 0;

  for (const segment of segments) {
    const segStart = toMs(segment.start);
    const segEnd = toMs(segment.end);
    const overlapStart = Math.max(start, segStart);
    const overlapEnd = Math.min(end, segEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    if (overlap > 0) {
      weightedSum += sentimentToScore(segment.sentiment, segment.confidence) * overlap;
      totalMs += overlap;
    }
  }

  if (!totalMs) {
    return 0;
  }
  return weightedSum / totalMs;
}

function formatSpeaker(speaker: unknown) {
  if (typeof speaker === "number") {
    return `Speaker ${String.fromCharCode(65 + speaker)}`;
  }
  if (typeof speaker === "string") {
    return speaker;
  }
  return "Speaker";
}

function buildUtterances(response: DeepgramResponse): Utterance[] {
  const utterances = response?.results?.utterances;
  if (Array.isArray(utterances) && utterances.length) {
    return utterances.map((utterance: any) => {
      const sentimentLabel =
        typeof utterance.sentiment === "string"
          ? utterance.sentiment
          : typeof utterance.sentiment?.sentiment === "string"
            ? utterance.sentiment.sentiment
            : undefined;
      const sentimentScore =
        typeof utterance.sentiment_score === "number"
          ? utterance.sentiment_score
          : typeof utterance.sentiment?.score === "number"
            ? utterance.sentiment.score
            : typeof utterance.sentiment?.sentiment_score === "number"
              ? utterance.sentiment.sentiment_score
              : sentimentLabel
                ? sentimentToScore(sentimentLabel, utterance.sentiment?.confidence ?? utterance.sentiment_confidence)
                : 0;

      return {
        start_ms: toMs(utterance.start),
        end_ms: toMs(utterance.end),
        speaker_id: formatSpeaker(utterance.speaker),
        text: utterance.transcript || "",
        sentiment_score: sentimentScore,
        confidence: typeof utterance.confidence === "number" ? utterance.confidence : 0.9,
      };
    });
  }

  const alt = response?.results?.channels?.[0]?.alternatives?.[0];
  const transcript = alt?.transcript || "";
  const duration = response?.metadata?.duration || 0;
  if (!transcript) {
    return [];
  }

  return [
    {
      start_ms: 0,
      end_ms: toMs(duration),
      speaker_id: "Speaker A",
      text: transcript,
      sentiment_score: 0,
      confidence: typeof alt?.confidence === "number" ? alt.confidence : 0.9,
    },
  ];
}

function buildInsights(
  utterances: Utterance[],
  overallSentiment: { timestamp: number; score: number }[],
  analyzeResponse: DeepgramResponse
): Insight[] {
  const insights: Insight[] = [];

  const sentiment = [...overallSentiment].sort((a, b) => a.timestamp - b.timestamp);
  const conflictPeak = sentiment.reduce((max, point) => Math.max(max, Math.max(0, -point.score)), 0);
  const firstConflict = sentiment.find((point) => Math.max(0, -point.score) >= 0.6);
  if (conflictPeak > 0.6) {
    insights.push({
      type: "conflict",
      timestamp: firstConflict?.timestamp ?? 0,
      severity: Math.min(1, conflictPeak),
      description: "A sustained negative stretch suggests a meaningful conflict or frustration point.",
    });
  }

  if (sentiment.length >= 2) {
    let worst = { rate: 0, timestamp: sentiment[0]!.timestamp };
    let best = { rate: 0, timestamp: sentiment[0]!.timestamp };
    let sumAbs = 0;
    let acc = 0;
    for (let i = 0; i < sentiment.length; i++) {
      const prev = sentiment[i - 1];
      const curr = sentiment[i]!;
      const dtMs = prev ? curr.timestamp - prev.timestamp : 0;
      const dtS = dtMs > 0 ? dtMs / 1000 : 1;
      const dv = prev ? curr.score - prev.score : 0;
      const rate = dv / dtS;
      if (rate < worst.rate) worst = { rate, timestamp: curr.timestamp };
      if (rate > best.rate) best = { rate, timestamp: curr.timestamp };
      sumAbs += Math.abs(rate);
      acc += curr.score * dtS;
    }

    const avgAbs = sumAbs / sentiment.length;

    if (!conflictPeak || worst.rate < -0.25) {
      insights.push({
        type: "conflict",
        timestamp: worst.timestamp,
        severity: Math.min(1, Math.max(0.2, Math.abs(worst.rate))),
        description: "A sharp drop in sentiment often marks an escalation or a triggering moment that changed the tone quickly.",
      });
    }

    if (best.rate > 0.25) {
      insights.push({
        type: "divergence",
        timestamp: best.timestamp,
        severity: Math.min(1, best.rate),
        description: "A strong rebound in sentiment suggests repair, reassurance, or a productive shift toward resolution.",
      });
    }

    if (Math.abs(acc) > 12) {
      insights.push({
        type: "divergence",
        timestamp: sentiment[sentiment.length - 1]!.timestamp,
        severity: Math.min(1, Math.abs(acc) / 25),
        description: acc < 0
          ? "Overall, negative moments outweighed positive ones across the conversation."
          : "Overall, positive moments outweighed negative ones across the conversation.",
      });
    } else if (avgAbs > 0.18) {
      insights.push({
        type: "loop",
        timestamp: sentiment[Math.floor(sentiment.length / 2)]!.timestamp,
        severity: Math.min(1, avgAbs / 0.5),
        description: "Frequent tone swings suggest emotional volatility, where the conversation repeatedly shifted between states.",
      });
    }
  }

  const loopMap = new Map<string, { count: number; timestamp: number }>();
  for (const utterance of utterances) {
    const normalized = utterance.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6)
      .join(" ");
    if (!normalized) {
      continue;
    }
    const existing = loopMap.get(normalized);
    if (existing) {
      existing.count += 1;
    } else {
      loopMap.set(normalized, { count: 1, timestamp: utterance.start_ms });
    }
  }
  const loopCandidate = [...loopMap.entries()].find(([, value]) => value.count >= 3);
  if (loopCandidate) {
    const [phrase, details] = loopCandidate;
    insights.push({
      type: "loop",
      timestamp: details.timestamp,
      severity: Math.min(1, details.count / 5),
      description: `Repeated theme detected: "${phrase}"`,
    });
  }

  if (overallSentiment.length >= 3) {
    const third = Math.floor(overallSentiment.length / 3);
    const startAvg =
      overallSentiment.slice(0, third).reduce((sum, s) => sum + s.score, 0) / (third || 1);
    const endAvg =
      overallSentiment.slice(-third).reduce((sum, s) => sum + s.score, 0) / (third || 1);
    if (endAvg - startAvg >= 0.4) {
      insights.push({
        type: "divergence",
        timestamp: overallSentiment[overallSentiment.length - third]?.timestamp ?? 0,
        severity: Math.min(1, (endAvg - startAvg) / 1.2),
        description: "Tone improves noticeably across the conversation.",
      });
    }
  }

  const speakerTotals = new Map<string, number>();
  let totalTalkTime = 0;
  for (const utterance of utterances) {
    const duration = Math.max(0, utterance.end_ms - utterance.start_ms);
    totalTalkTime += duration;
    speakerTotals.set(utterance.speaker_id, (speakerTotals.get(utterance.speaker_id) || 0) + duration);
  }
  const dominant = [...speakerTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominant && totalTalkTime > 0) {
    const share = dominant[1] / totalTalkTime;
    if (share >= 0.65) {
      insights.push({
        type: "speaker_dynamics",
        timestamp: utterances[0]?.start_ms ?? 0,
        severity: Math.min(1, share),
        description: `${dominant[0]} dominates the floor (${Math.round(share * 100)}% of talk time).`,
      });
    }
  }

  const topics = analyzeResponse?.results?.topics || analyzeResponse?.topics;
  if (Array.isArray(topics) && topics.length) {
    const topTopic = topics[0];
    insights.push({
      type: "loop",
      timestamp: utterances[0]?.start_ms ?? 0,
      severity: Math.min(1, topTopic.confidence ?? 0.5),
      description: `Recurring focus on "${topTopic.topic || "key topic"}".`,
    });
  }

  const intents = analyzeResponse?.results?.intents || analyzeResponse?.intents;
  if (Array.isArray(intents) && intents.length && insights.length < 3) {
    const topIntent = intents[0];
    insights.push({
      type: "speaker_dynamics",
      timestamp: utterances[0]?.start_ms ?? 0,
      severity: Math.min(1, topIntent.confidence ?? 0.4),
      description: `Primary intent: ${topIntent.intent || "intent"}.`,
    });
  }

  const unique = new Map<string, Insight>();
  for (const insight of insights) {
    const key = `${insight.type}:${insight.description}`;
    if (!unique.has(key)) unique.set(key, insight);
  }

  const prioritized = Array.from(unique.values()).sort((a, b) => b.severity - a.severity);
  if (!prioritized.length) {
    prioritized.push({
      type: "divergence",
      timestamp: utterances[0]?.start_ms ?? 0,
      severity: 0.3,
      description: "The overall tone stayed relatively neutral with no single moment dominating the conversation.",
    });
  }
  return prioritized.slice(0, 5);
}

export async function analyzeWithDeepgram(jobId: number, input: DeepgramInput): Promise<AnalysisResult> {
  const listenParams = new URLSearchParams({
    model: process.env.DEEPGRAM_MODEL || DEFAULT_MODEL,
    smart_format: "true",
    diarize: "true",
    sentiment: "true",
    summarize: "true",
    topics: "true",
    intents: "true",
    utterances: "true",
    paragraphs: "true",
    detect_language: "true",
  });

  const listenResult = await callDeepgram("listen", listenParams, input);
  const listenResponse = listenResult;

  console.log("Raw Deepgram API Response:", JSON.stringify(listenResponse, null, 2));

  const utterances = buildUtterances(listenResponse);
  const sentiments = collectSentiments(listenResponse);

  const enrichedUtterances = utterances.map((utterance) => ({
    ...utterance,
    sentiment_score: sentiments.length
      ? scoreUtterance(utterance, sentiments)
      : utterance.sentiment_score,
  }));

  const overallSentiment = sentiments.map((segment) => ({
    timestamp: toMs(segment.start),
    score: sentimentToScore(segment.sentiment, segment.confidence),
  }));

  if (!overallSentiment.length) {
    for (const utterance of enrichedUtterances) {
      overallSentiment.push({
        timestamp: utterance.start_ms,
        score: utterance.sentiment_score,
      });
    }
  }

  const conflictHeatmap = overallSentiment.map((point) => ({
    timestamp: point.timestamp,
    intensity: Math.max(0, -point.score),
  }));

  const speakerStatsMap = new Map<string, { total: number; turns: number; sentimentSum: number }>();
  for (const utterance of enrichedUtterances) {
    const duration = Math.max(0, utterance.end_ms - utterance.start_ms);
    const entry = speakerStatsMap.get(utterance.speaker_id) || {
      total: 0,
      turns: 0,
      sentimentSum: 0,
    };
    entry.total += duration;
    entry.turns += 1;
    entry.sentimentSum += utterance.sentiment_score;
    speakerStatsMap.set(utterance.speaker_id, entry);
  }

  const speakerStats = [...speakerStatsMap.entries()].map(([speaker_id, entry]) => ({
    speaker_id,
    total_talk_time_ms: entry.total,
    turn_count: entry.turns,
    avg_sentiment: entry.turns ? entry.sentimentSum / entry.turns : 0,
  }));

  const insights = buildInsights(enrichedUtterances, overallSentiment, listenResponse || {});

  // Extract summary from listen response
  let summary: string | undefined;
  if (listenResponse) {
    const summaryObj = listenResponse?.results?.summary;
    
    // Only extract the actual summary text, not status fields
    if (typeof summaryObj?.short === 'string' && summaryObj.short) {
      summary = summaryObj.short;
    }
  }

  // Extract topics from listen response
  let topics: Array<{ topic: string; confidence: number }> | undefined;
  let topicSegments: TopicSegment[] | undefined;
  if (listenResponse) {
    // Check for topics in the results
    const topicsData = listenResponse?.results?.topics;
    
    if (Array.isArray(topicsData) && topicsData.length > 0) {
      // If topics is directly an array
      const allTopics: Array<{ topic: string; confidence: number }> = [];
      const seenTopics = new Set<string>();
      
      for (const t of topicsData) {
        if (t?.text && typeof t.confidence === 'number' && !seenTopics.has(t.text)) {
          allTopics.push({
            topic: t.text,
            confidence: t.confidence
          });
          seenTopics.add(t.text);
        }
      }
      
      if (allTopics.length > 0) {
        topics = allTopics.sort((a, b) => b.confidence - a.confidence);
      }
    } else if (topicsData && typeof topicsData === 'object') {
      // Check if topics has a segments structure
      const segments = topicsData.segments;
      
      if (Array.isArray(segments) && segments.length > 0) {
        const allTopics: Array<{ topic: string; confidence: number }> = [];
        const allTopicSegments: TopicSegment[] = [];
        const seenTopics = new Set<string>();
        
        for (const segment of segments) {
          if (Array.isArray(segment.topics)) {
            for (const t of segment.topics) {
              if (t?.topic && typeof t.confidence_score === 'number') {
                // Dedupe for the flat topics list
                if (!seenTopics.has(t.topic)) {
                  allTopics.push({ topic: t.topic, confidence: t.confidence_score });
                  seenTopics.add(t.topic);
                }
                // Keep all segment-level entries for transcript matching
                if (segment.text && typeof segment.start_word === 'number' && typeof segment.end_word === 'number') {
                  allTopicSegments.push({
                    text: segment.text,
                    start_word: segment.start_word,
                    end_word: segment.end_word,
                    topic: t.topic,
                    confidence: t.confidence_score,
                  });
                }
              }
            }
          }
        }
        
        if (allTopics.length > 0) {
          topics = allTopics.sort((a, b) => b.confidence - a.confidence);
        }
        if (allTopicSegments.length > 0) {
          topicSegments = allTopicSegments;
        }
      }
    }
  }

  // Extract intents from listen response
  let intents: Array<{ intent: string; confidence: number }> | undefined;
  let intentSegments: IntentSegment[] | undefined;
  if (listenResponse) {
    // Navigate to intents segments (same level as topics)
    const segments = listenResponse?.results?.intents?.segments;
    
    if (Array.isArray(segments) && segments.length > 0) {
      const allIntents: Array<{ intent: string; confidence: number }> = [];
      const allIntentSegments: IntentSegment[] = [];
      const seenIntents = new Set<string>();
      
      for (const segment of segments) {
        if (Array.isArray(segment.intents)) {
          for (const i of segment.intents) {
            if (i?.intent && typeof i.confidence_score === 'number') {
              // Dedupe for the flat intents list
              if (!seenIntents.has(i.intent)) {
                allIntents.push({ intent: i.intent, confidence: i.confidence_score });
                seenIntents.add(i.intent);
              }
              // Keep all segment-level entries for matching
              if (segment.text && typeof segment.start_word === 'number' && typeof segment.end_word === 'number') {
                allIntentSegments.push({
                  text: segment.text,
                  start_word: segment.start_word,
                  end_word: segment.end_word,
                  intent: i.intent,
                  confidence: i.confidence_score,
                });
              }
            }
          }
        }
      }
      
      if (allIntents.length > 0) {
        intents = allIntents.sort((a, b) => b.confidence - a.confidence);
      }
      if (allIntentSegments.length > 0) {
        intentSegments = allIntentSegments;
      }
    }
  }

  return {
    jobId,
    utterances: enrichedUtterances,
    insights,
    speakerStats,
    overallSentiment,
    conflictHeatmap,
    summary,
    topics,
    intents,
    topicSegments,
    intentSegments,
  };
}

