import { useEffect, useRef, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Utterance, TopicSegment, IntentSegment } from '@shared/schema';
import { User, MessageSquare, Search, X, ChevronDown, Check } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptProps {
  utterances: Utterance[];
  mode?: 'analysis' | 'text-breakdown';
  topicSegments?: TopicSegment[];
  intentSegments?: IntentSegment[];
  activeTimestamp?: number;
  onUtteranceClick?: (timestamp: number) => void;
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string) {
  return normalizeText(text).split(' ').filter(Boolean).length;
}

function findBestByWordRange<T extends { start_word?: number; end_word?: number; confidence: number }>(
  utteranceStartWord: number,
  utteranceEndWord: number,
  segments?: T[]
) {
  if (!segments?.length) return undefined;

  let best: T | undefined;
  let bestOverlap = 0;

  for (const segment of segments) {
    if (typeof segment.start_word !== 'number' || typeof segment.end_word !== 'number') {
      continue;
    }

    const overlapStart = Math.max(utteranceStartWord, segment.start_word);
    const overlapEnd = Math.min(utteranceEndWord, segment.end_word);
    const overlap = Math.max(0, overlapEnd - overlapStart + 1);

    if (overlap > bestOverlap || (overlap === bestOverlap && overlap > 0 && segment.confidence > (best?.confidence ?? 0))) {
      best = segment;
      bestOverlap = overlap;
    }
  }

  return bestOverlap > 0 ? best : undefined;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-400/30 text-foreground rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  );
}

type FilterVariant = 'speaker' | 'topic' | 'intent' | 'sentiment';

const filterVariantStyles: Record<FilterVariant, { trigger: string; triggerActive: string; badge: string; check: string; item: string }> = {
  speaker: {
    trigger: 'border-border text-muted-foreground hover:border-slate-400 hover:text-foreground',
    triggerActive: 'border-slate-500 text-foreground bg-slate-500/10',
    badge: 'bg-slate-500 text-white',
    check: 'text-slate-500',
    item: 'hover:bg-slate-500/10',
  },
  topic: {
    trigger: 'border-purple-500/30 text-purple-400 hover:border-purple-400',
    triggerActive: 'border-purple-500 text-purple-300 bg-purple-500/10',
    badge: 'bg-purple-600 text-white',
    check: 'text-purple-500',
    item: 'hover:bg-purple-500/10',
  },
  intent: {
    trigger: 'border-blue-500/30 text-blue-400 hover:border-blue-400',
    triggerActive: 'border-blue-500 text-blue-300 bg-blue-500/10',
    badge: 'bg-blue-600 text-white',
    check: 'text-blue-500',
    item: 'hover:bg-blue-500/10',
  },
  sentiment: {
    trigger: 'border-emerald-500/30 text-emerald-400 hover:border-emerald-400',
    triggerActive: 'border-emerald-500 text-emerald-300 bg-emerald-500/10',
    badge: 'bg-emerald-600 text-white',
    check: 'text-emerald-500',
    item: 'hover:bg-emerald-500/10',
  },
};

const SENTIMENT_OPTIONS = ['Positive', 'Neutral', 'Negative'] as const;
type SentimentLabel = typeof SENTIMENT_OPTIONS[number];

function sentimentOf(score: number): SentimentLabel {
  if (score > 0.2) return 'Positive';
  if (score < -0.2) return 'Negative';
  return 'Neutral';
}

const sentimentDotColor: Record<SentimentLabel, string> = {
  Positive: 'bg-emerald-500',
  Neutral: 'bg-slate-400',
  Negative: 'bg-rose-500',
};

function FilterDropdown({
  label, options, selected, variant, onToggle, formatLabel,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  variant: FilterVariant;
  onToggle: (val: string) => void;
  formatLabel?: (val: string) => string;
}) {
  const styles = filterVariantStyles[variant];
  const count = selected.size;

  if (!options.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all duration-150',
          count > 0 ? styles.triggerActive : styles.trigger
        )}>
          {label}
          {count > 0 && (
            <span className={cn('inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold', styles.badge)}>
              {count}
            </span>
          )}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-max min-w-[10rem] max-w-[280px] p-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 pb-1.5">{label}</p>
        <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                'w-full flex items-start gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors',
                styles.item
              )}
            >
              <span className={cn(
                'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                selected.has(opt) ? cn('border-transparent', styles.badge) : 'border-border'
              )}>
                {selected.has(opt) && <Check className="w-2.5 h-2.5" />}
              </span>
              <span className="leading-snug break-words">{formatLabel ? formatLabel(opt) : opt}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Transcript({ utterances, mode = 'analysis', topicSegments, intentSegments, activeTimestamp, onUtteranceClick }: TranscriptProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const isTextBreakdownMode = mode === 'text-breakdown';

  const [search, setSearch] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [selectedIntents, setSelectedIntents] = useState<Set<string>>(new Set());
  const [selectedSentiments, setSelectedSentiments] = useState<Set<SentimentLabel>>(new Set());

  // Precompute word ranges once
  let runningWordIndex = 1;
  const utteranceWordRanges = utterances.map((utterance) => {
    const words = countWords(utterance.text || '');
    const startWord = runningWordIndex;
    const endWord = Math.max(startWord, startWord + Math.max(0, words - 1));
    runningWordIndex = endWord + 1;
    return { startWord, endWord };
  });

  // Build label maps
  const labeledUtterances = useMemo(() => utterances.map((u, i) => {
    const wordRange = utteranceWordRanges[i];
    const matchedTopic = isTextBreakdownMode
      ? findBestByWordRange(wordRange.startWord, wordRange.endWord, topicSegments)
      : undefined;
    const matchedIntent = isTextBreakdownMode
      ? findBestByWordRange(wordRange.startWord, wordRange.endWord, intentSegments)
      : undefined;
    return { u, i, wordRange, matchedTopic, matchedIntent };
  }), [utterances, topicSegments, intentSegments, isTextBreakdownMode]);

  // Unique filter options
  const allSpeakers = useMemo(() => [...new Set(utterances.map(u => u.speaker_id))], [utterances]);
  const allTopics = useMemo(() => [...new Set(labeledUtterances.flatMap(({ matchedTopic }) => matchedTopic ? [matchedTopic.topic] : []))], [labeledUtterances]);
  const allIntents = useMemo(() => [...new Set(labeledUtterances.flatMap(({ matchedIntent }) => matchedIntent ? [matchedIntent.intent] : []))], [labeledUtterances]);

  const hasFilters = selectedSpeakers.size > 0 || selectedTopics.size > 0 || selectedIntents.size > 0 || selectedSentiments.size > 0 || search.trim().length > 0;

  const filteredUtterances = useMemo(() => labeledUtterances.filter(({ u, matchedTopic, matchedIntent }) => {
    if (selectedSpeakers.size > 0 && !selectedSpeakers.has(u.speaker_id)) return false;
    if (selectedSentiments.size > 0 && !selectedSentiments.has(sentimentOf(u.sentiment_score))) return false;
    if (selectedTopics.size > 0 && (!matchedTopic || !selectedTopics.has(matchedTopic.topic))) return false;
    if (selectedIntents.size > 0 && (!matchedIntent || !selectedIntents.has(matchedIntent.intent))) return false;
    if (search.trim()) {
      if (!u.text.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  }), [labeledUtterances, selectedSpeakers, selectedTopics, selectedIntents, selectedSentiments, search]);

  function toggle<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  }

  useEffect(() => {
    if (activeTimestamp !== undefined && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTimestamp]);

  const isActive = (u: Utterance) => {
    if (!activeTimestamp) return false;
    return (activeTimestamp >= u.start_ms && activeTimestamp <= u.end_ms) ||
           (Math.abs(activeTimestamp - u.start_ms) < 1000);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Transcript
          </h3>
          <span className="text-xs text-muted-foreground">
            {filteredUtterances.length !== utterances.length
              ? `${filteredUtterances.length} / ${utterances.length} turns`
              : `${utterances.length} turns`}
          </span>
        </div>

        {/* Search + filters — text-breakdown mode only */}
        {isTextBreakdownMode && (
          <div className="flex items-center gap-2">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-7 h-7 text-xs bg-background"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <FilterDropdown
              label="Speaker"
              options={allSpeakers}
              selected={selectedSpeakers}
              variant="speaker"
              onToggle={v => setSelectedSpeakers(toggle(selectedSpeakers, v))}
            />
            <FilterDropdown
              label="Topics"
              options={allTopics}
              selected={selectedTopics}
              variant="topic"
              onToggle={v => setSelectedTopics(toggle(selectedTopics, v))}
              formatLabel={v => `# ${v}`}
            />
            <FilterDropdown
              label="Intents"
              options={allIntents}
              selected={selectedIntents}
              variant="intent"
              onToggle={v => setSelectedIntents(toggle(selectedIntents, v))}
              formatLabel={v => `→ ${v}`}
            />

            {hasFilters && (
              <button
                onClick={() => { setSelectedSpeakers(new Set()); setSelectedTopics(new Set()); setSelectedIntents(new Set()); setSelectedSentiments(new Set()); setSearch(''); }}
                className="text-[11px] text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Analysis mode filters */}
        {!isTextBreakdownMode && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-7 h-7 text-xs bg-background"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <FilterDropdown
              label="Speaker"
              options={allSpeakers}
              selected={selectedSpeakers}
              variant="speaker"
              onToggle={v => setSelectedSpeakers(toggle(selectedSpeakers, v))}
            />

            {/* Sentiment inline toggle buttons */}
            <div className="flex items-center gap-1">
              {SENTIMENT_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSentiments(toggle(selectedSentiments, s))}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all duration-150',
                    selectedSentiments.has(s)
                      ? s === 'Positive' ? 'bg-emerald-600 text-white border-emerald-600'
                        : s === 'Negative' ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-600 text-white border-slate-600'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', sentimentDotColor[s])} />
                  {s}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={() => { setSelectedSpeakers(new Set()); setSelectedSentiments(new Set()); setSearch(''); }}
                className="text-[11px] text-muted-foreground hover:text-foreground shrink-0"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {isTextBreakdownMode && (!topicSegments?.length && !intentSegments?.length) && (
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border/40 bg-muted/10">
          No topic/intent segment data available for this job yet.
        </div>
      )}

      <ScrollArea className="flex-1 p-4" onWheelCapture={e => e.stopPropagation()}>
        <div className="space-y-4 pr-2">
          <AnimatePresence mode="popLayout">
            {filteredUtterances.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No turns match your filters.
              </motion.div>
            ) : (
              filteredUtterances.map(({ u, i, matchedTopic, matchedIntent }) => {
                const active = isActive(u);
                const sentimentColor = u.sentiment_score > 0.2
                  ? 'bg-emerald-500'
                  : u.sentiment_score < -0.2
                    ? 'bg-rose-500'
                    : 'bg-slate-300';

                return (
                  <motion.div
                    key={`${u.speaker_id}-${u.start_ms}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    ref={active ? activeRef : null}
                    data-utterance-start={u.start_ms}
                    onClick={() => onUtteranceClick?.(u.start_ms)}
                    className={cn(
                      isTextBreakdownMode
                        ? "py-3 px-4 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
                        : "relative pl-6 py-3 pr-4 rounded-lg cursor-pointer transition-all duration-200 border border-transparent group",
                      active
                        ? "bg-accent/5 border-accent/20 shadow-sm"
                        : "hover:bg-muted/30"
                    )}
                  >
                    {!isTextBreakdownMode && (
                      <div className={cn(
                        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300",
                        active ? "w-1.5 opacity-100" : "opacity-40 group-hover:opacity-100",
                        sentimentColor
                      )} />
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                        u.speaker_id === "Speaker A" ? "text-[hsl(var(--speaker-a))]" : "text-[hsl(var(--speaker-b))]"
                      )}>
                        <User className="w-3 h-3" />
                        {u.speaker_id}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {format(new Date(u.start_ms), 'mm:ss')}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm leading-relaxed",
                      active ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      <HighlightText text={u.text} query={search} />
                    </p>

                    {isTextBreakdownMode && (matchedTopic || matchedIntent) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {matchedTopic && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                            # {matchedTopic.topic}
                          </span>
                        )}
                        {matchedIntent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                            → {matchedIntent.intent}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
