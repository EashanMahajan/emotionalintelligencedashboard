import type { AnalysisResult } from "@shared/schema";

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function exportAnalysisToCSV(results: AnalysisResult, filename: string): void {
  const lines: string[] = [];
  
  // Header
  lines.push('Resonance Analysis Export');
  lines.push(`Filename: ${filename}`);
  lines.push(`Export Date: ${new Date().toISOString()}`);
  lines.push('');
  
  // AI Summary Section
  if (results.summary) {
    lines.push('=== AI SUMMARY ===');
    // Handle both string and object formats
    const summaryText = typeof results.summary === 'string' 
      ? results.summary 
      : (results.summary as any)?.short || '';
    if (summaryText) {
      lines.push(escapeCSV(summaryText));
    }
    lines.push('');
  }
  
  // Topics Section
  if (results.topics && results.topics.length > 0) {
    lines.push('=== KEY TOPICS ===');
    lines.push('Topic,Confidence');
    results.topics.forEach(topic => {
      lines.push([
        escapeCSV(topic.topic),
        `${Math.round(topic.confidence * 100)}%`
      ].join(','));
    });
    lines.push('');
  }
  
  // Intents Section
  if (results.intents && results.intents.length > 0) {
    lines.push('=== DETECTED INTENTS ===');
    lines.push('Intent,Confidence');
    results.intents.forEach(intent => {
      lines.push([
        escapeCSV(intent.intent),
        `${Math.round(intent.confidence * 100)}%`
      ].join(','));
    });
    lines.push('');
  }
  
  // Utterances Section
  lines.push('=== CONVERSATION TRANSCRIPT ===');
  lines.push('Start Time,End Time,Duration,Speaker,Text,Sentiment Score,Confidence');
  
  results.utterances.forEach(utt => {
    const duration = formatTime(utt.end_ms - utt.start_ms);
    lines.push([
      formatTime(utt.start_ms),
      formatTime(utt.end_ms),
      duration,
      escapeCSV(utt.speaker_id),
      escapeCSV(utt.text),
      utt.sentiment_score.toFixed(3),
      utt.confidence.toFixed(3)
    ].join(','));
  });
  
  lines.push('');
  
  // Speaker Statistics
  lines.push('=== SPEAKER STATISTICS ===');
  lines.push('Speaker,Talk Time (seconds),Turn Count,Average Sentiment,Talk Percentage');
  
  const totalTalkTime = results.speakerStats.reduce((sum, stat) => sum + stat.total_talk_time_ms, 0);
  
  results.speakerStats.forEach(stat => {
    const talkTimeSeconds = (stat.total_talk_time_ms / 1000).toFixed(1);
    const percentage = ((stat.total_talk_time_ms / totalTalkTime) * 100).toFixed(1);
    lines.push([
      escapeCSV(stat.speaker_id),
      talkTimeSeconds,
      stat.turn_count,
      stat.avg_sentiment.toFixed(3),
      `${percentage}%`
    ].join(','));
  });
  
  lines.push('');
  
  // Key Insights
  lines.push('=== KEY INSIGHTS ===');
  lines.push('Type,Timestamp,Severity,Description');
  
  results.insights.forEach(insight => {
    lines.push([
      escapeCSV(insight.type),
      formatTime(insight.timestamp),
      insight.severity.toFixed(2),
      escapeCSV(insight.description)
    ].join(','));
  });
  
  lines.push('');
  
  // Overall Sentiment Timeline
  lines.push('=== SENTIMENT TIMELINE ===');
  lines.push('Timestamp,Sentiment Score');
  
  results.overallSentiment.forEach(point => {
    lines.push([
      formatTime(point.timestamp),
      point.score.toFixed(3)
    ].join(','));
  });
  
  lines.push('');
  
  // Conflict Heatmap
  lines.push('=== CONFLICT INTENSITY ===');
  lines.push('Timestamp,Conflict Intensity');
  
  results.conflictHeatmap.forEach(point => {
    lines.push([
      formatTime(point.timestamp),
      point.intensity.toFixed(3)
    ].join(','));
  });
  
  // Create and download CSV
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const sanitizedFilename = filename.replace(/\.[^/.]+$/, '');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizedFilename}_analysis.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
