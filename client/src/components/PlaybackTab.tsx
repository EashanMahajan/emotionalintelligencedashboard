import { useEffect, useRef, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { getAudioFile } from "@/lib/audio-storage";
import { cn } from "@/lib/utils";
import {
  Play, Pause, Volume, Volume1, Volume2, VolumeX,
  Music, AlertCircle, Loader2, UploadCloud, FileText,
  SkipBack, SkipForward, Download,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { Utterance, Insight } from "@shared/schema";

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VolumeIcon({ vol }: { vol: number }) {
  if (vol === 0) return <VolumeX className="w-4 h-4" />;
  if (vol < 0.33) return <Volume className="w-4 h-4" />;
  if (vol < 0.66) return <Volume1 className="w-4 h-4" />;
  return <Volume2 className="w-4 h-4" />;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

const SPEAKER_COLORS = [
  { badge: "bg-blue-500/15 text-blue-400 border-blue-500/25", bar: "bg-blue-500" },
  { badge: "bg-violet-500/15 text-violet-400 border-violet-500/25", bar: "bg-violet-500" },
  { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", bar: "bg-emerald-500" },
  { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25", bar: "bg-amber-500" },
  { badge: "bg-rose-500/15 text-rose-400 border-rose-500/25", bar: "bg-rose-500" },
];

export interface PlaybackTabHandle {
  seekTo: (ms: number) => void;
}

interface PlaybackTabProps {
  jobId: number;
  filename: string;
  utterances: Utterance[];
  insights: Insight[];
}

export const PlaybackTab = forwardRef<PlaybackTabHandle, PlaybackTabProps>(
function PlaybackTab({ jobId, filename, utterances, insights }: PlaybackTabProps, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Live transcript
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  const speakerOrder = useMemo(
    () => [...new Set(utterances.map((u) => u.speaker_id))],
    [utterances]
  );

  const activeIndex = useMemo(() => {
    const ms = currentTime * 1000;
    return utterances.findIndex((u) => ms >= u.start_ms && ms < u.end_ms);
  }, [currentTime, utterances]);

  // Auto-scroll to active utterance
  useEffect(() => {
    if (activeIndex >= 0 && activeRowRef.current && transcriptRef.current) {
      transcriptRef.current.scrollTo({ top: activeRowRef.current.offsetTop, behavior: "smooth" });
    }
  }, [activeIndex]);

  // Load audio from IndexedDB
  useEffect(() => {
    let url: string;
    getAudioFile(jobId)
      .then((file) => {
        if (!file) {
          setNotFound(true);
        } else {
          setAudioFile(file);
          url = URL.createObjectURL(file);
          setBlobUrl(url);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [jobId]);

  // Expose seekTo for parent to call imperatively
  useImperativeHandle(ref, () => ({
    seekTo: (ms: number) => {
      const el = audioRef.current;
      if (!el) return;
      const t = ms / 1000;
      if (!isFinite(t)) return;
      el.currentTime = t;
      setCurrentTime(t);
      el.play().catch(() => {});
    },
  }));

  // Sync volume/muted
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play().catch(() => {});
  }, [playing]);

  const durationFixPending = useRef(false);

  const skip = useCallback((delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const d = isFinite(el.duration) ? el.duration : 0;
    const t = Math.min(Math.max(el.currentTime + delta, 0), d);
    if (!isFinite(t)) return;
    el.currentTime = t;
    setCurrentTime(t);
  }, []);

  const handleSeek = (val: number[]) => {
    const el = audioRef.current;
    if (!el || !isFinite(val[0])) return;
    el.currentTime = val[0];
    setCurrentTime(val[0]);
  };

  const handleVolumeChange = (val: number[]) => {
    setVolume(val[0]);
    setMuted(val[0] === 0);
  };

  const toggleMute = () => setMuted((m) => !m);

  const handleDownload = () => {
    if (!audioFile) return;
    const url = URL.createObjectURL(audioFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = audioFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.code === "ArrowLeft")  { e.preventDefault(); skip(-10); }
      else if (e.code === "ArrowRight") { e.preventDefault(); skip(10); }
      else if (e.key === "j") skip(-10);
      else if (e.key === "l") skip(10);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, skip]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Seek-bar markers: insights + high-negativity utterances
  const seekMarkers = useMemo(() => {
    if (duration <= 0) return [];
    const markers: { pct: number; color: string; title: string }[] = [];

    insights.forEach((ins) => {
      const pct = (ins.timestamp / 1000 / duration) * 100;
      markers.push({
        pct,
        color: ins.type === "conflict" ? "bg-rose-500" : "bg-amber-400",
        title: ins.description,
      });
    });

    utterances.forEach((u) => {
      if (u.sentiment_score < -0.4) {
        const pct = (u.start_ms / 1000 / duration) * 100;
        markers.push({ pct, color: "bg-rose-400/70", title: u.text });
      }
    });

    return markers;
  }, [insights, utterances, duration]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading audio…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="bg-muted rounded-full p-4">
          <AlertCircle className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">Recording not available</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Audio files are stored locally in your browser. This recording was either uploaded in a previous session or on a different device.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={() => window.location.assign("/upload")}>
          <UploadCloud className="w-3.5 h-3.5" />
          New Analysis
        </Button>
      </div>
    );
  }

  const seekTo = (u: Utterance) => {
    const el = audioRef.current;
    if (!el) return;
    const t = u.start_ms / 1000;
    if (!isFinite(t)) return;
    el.currentTime = t;
    setCurrentTime(t);
    el.play().catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Hidden native audio element */}
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setCurrentTime(0); }}
          onTimeUpdate={() => {
            const t = audioRef.current?.currentTime ?? 0;
            if (isFinite(t)) setCurrentTime(t);
          }}
          onLoadedMetadata={() => {
            const el = audioRef.current;
            if (!el) return;
            if (!isFinite(el.duration) || el.duration === 0) {
              // MediaRecorder blobs lack duration metadata — seek to end to force browser to compute it
              durationFixPending.current = true;
              el.currentTime = 1e9;
            } else {
              setDuration(el.duration);
            }
          }}
          onSeeked={() => {
            const el = audioRef.current;
            if (!el) return;
            if (durationFixPending.current) {
              durationFixPending.current = false;
              if (isFinite(el.duration)) setDuration(el.duration);
              el.currentTime = 0;
              setCurrentTime(0);
            }
          }}
          preload="metadata"
        />
      )}

      {/* Player card */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
        {/* File info + download */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 shrink-0">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{filename}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {duration > 0 ? formatTime(duration) : "—"} · Local recording
            </p>
          </div>
          {audioFile && (
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={handleDownload} title="Download recording">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Waveform bars */}
        <div className="flex items-center gap-[3px] h-10 px-1">
          {Array.from({ length: 64 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.6) * 12 + Math.sin(i * 1.3) * 8;
            const filled = progressPct > 0 && (i / 64) * 100 <= progressPct;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-100",
                  playing && filled ? "bg-primary" : filled ? "bg-primary/60" : "bg-muted"
                )}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Seek bar with markers */}
        <div className="space-y-1">
          <div className="relative">
            <Slider
              min={0}
              max={duration || 1}
              step={0.1}
              value={[currentTime]}
              onValueChange={handleSeek}
              className="w-full"
            />
            {/* Insight / sentiment markers overlaid on track */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 px-2.5">
              {seekMarkers.map((m, i) => (
                <div
                  key={i}
                  title={m.title}
                  className={cn("absolute w-1 h-3 rounded-sm -translate-x-1/2 -translate-y-1/2 top-1/2 opacity-80", m.color)}
                  style={{ left: `${Math.min(Math.max(m.pct, 0), 100)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Transport: skip back, play/pause, skip forward */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground" onClick={() => skip(-10)} title="Back 10s (← or J)">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="icon" className="w-11 h-11 rounded-full shrink-0" onClick={togglePlay} disabled={!blobUrl} title="Play / Pause (Space)">
              {playing
                ? <Pause className="w-5 h-5 fill-current" />
                : <Play className="w-5 h-5 fill-current translate-x-[1px]" />
              }
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground" onClick={() => skip(10)} title="Forward 10s (→ or L)">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-0.5 ml-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "text-[11px] font-semibold px-1.5 py-0.5 rounded transition-colors",
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s === 1 ? "1×" : `${s}×`}
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-1 max-w-[140px] ml-auto">
            <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0" onClick={toggleMute}>
              <VolumeIcon vol={muted ? 0 : volume} />
            </button>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[muted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-[10px] text-muted-foreground/50 text-center -mt-1">
          Space · ← / → skip 10s · J / L · speed buttons
        </p>
      </div>

      {/* Live Transcript */}
      {utterances.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Live Transcript</span>
            {playing && (
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-primary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div
            ref={transcriptRef}
            className="relative max-h-[340px] overflow-y-auto divide-y divide-border/30"
          >
            {utterances.map((u, idx) => {
              const isActive = idx === activeIndex;
              const speakerIdx = speakerOrder.indexOf(u.speaker_id) % SPEAKER_COLORS.length;
              const colors = SPEAKER_COLORS[speakerIdx];
              const sentimentDot =
                u.sentiment_score > 0.2 ? "bg-emerald-500"
                : u.sentiment_score < -0.2 ? "bg-rose-500"
                : "bg-slate-400";

              return (
                <div
                  key={idx}
                  ref={isActive ? activeRowRef : null}
                  onClick={() => seekTo(u)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150",
                    isActive ? "bg-primary/8 dark:bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  <div className={cn("w-0.5 self-stretch rounded-full shrink-0 transition-colors duration-200", isActive ? "bg-primary" : "bg-transparent")} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", colors.badge)}>
                        {u.speaker_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatTime(u.start_ms / 1000)}
                      </span>
                      <div className={cn("w-1.5 h-1.5 rounded-full ml-auto shrink-0", sentimentDot)} />
                    </div>
                    <p className={cn("text-sm leading-relaxed transition-colors duration-150", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {u.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
});
