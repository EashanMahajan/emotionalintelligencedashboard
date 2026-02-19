import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AnalysisResult } from "@shared/schema";

interface Message {
  role: "user" | "model";
  content: string;
  streaming?: boolean;
}

interface Props {
  context: AnalysisResult;
  filename?: string;
}

export function ChatPanel({ context, filename }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hi! I've read the full transcript and analysis for **${filename ?? "this conversation"}**. Ask me anything — who dominated the conversation, what triggered the tension at a specific timestamp, how sentiment shifted, or anything else you'd like to understand.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setLoading(true);

    // placeholder for streaming
    setMessages((prev) => [...prev, { role: "model", content: "", streaming: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages
            .filter((m) => !m.streaming)
            .map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = "Request failed";
        try { errMsg = JSON.parse(errText).message ?? errMsg; } catch { errMsg = errText || errMsg; }
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "model", content: `Error: ${errMsg}` },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "model", content: accumulated, streaming: true },
          ]);
        }
      }

      // finalise — remove streaming flag
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "model", content: accumulated },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "model", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Render simple markdown-ish formatting: **bold**, bullet lists
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Convert **bold**
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={j}>{p.slice(2, -2)}</strong>
        ) : (
          p
        )
      );
      return (
        <span key={i}>
          {parts}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  }

  const SUGGESTIONS = [
    "Who dominated the conversation?",
    "When was the most tense moment?",
    "What caused the negative sentiment spike?",
    "Summarise each speaker's emotional journey",
  ];

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
        title="Ask AI about this conversation"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-22 right-6 z-50 flex flex-col w-[380px] h-[540px] rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Conversation AI</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {filename ? `Analysing: ${filename}` : "Ask anything about this call"}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0" onClick={() => setOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      m.role === "model" ? "bg-primary/15" : "bg-muted"
                    }`}>
                      {m.role === "model"
                        ? <Bot className="w-3 h-3 text-primary" />
                        : <User className="w-3 h-3 text-muted-foreground" />
                      }
                    </div>
                    {/* Bubble */}
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 text-foreground rounded-tl-sm border border-border/30"
                    }`}>
                      {m.content ? renderContent(m.content) : (
                        <span className="flex gap-1 items-center text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Thinking…
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Suggestion chips — only show before any user message */}
            {messages.filter((m) => m.role === "user").length === 0 && (
              <div className="px-3 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                      className="text-[10px] px-2 py-1 rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 border-t border-border/40">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the conversation…"
                  rows={1}
                  className="resize-none text-[12px] min-h-[36px] max-h-[100px] py-2 leading-snug"
                  disabled={loading}
                />
                <Button
                  size="icon"
                  className="h-[36px] w-[36px] shrink-0"
                  onClick={send}
                  disabled={!input.trim() || loading}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
