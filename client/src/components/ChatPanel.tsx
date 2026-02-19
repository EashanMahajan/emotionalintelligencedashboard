import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisResult } from "@shared/schema";

interface Message {
  role: "user" | "model";
  content: string;
  thinking?: boolean;
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

    // Build updated message list (exclude the initial greeting from history sent to server)
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "model", content: "", thinking: true }]);
    setLoading(true);

    try {
      // Only send real conversation turns — strip the initial model greeting
      const historyForServer = nextMessages
        .filter((m) => !(m as Message & { thinking?: boolean }).thinking)
        .filter((m, i) => !(i === 0 && m.role === "model")); // skip opening greeting

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForServer, context }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error ?? data.message ?? `Server error ${res.status}`;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "model", content: `⚠️ ${errMsg}` },
        ]);
        return;
      }

      if (!data.reply) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "model", content: "⚠️ Got an empty response. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "model", content: data.reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "model", content: `⚠️ ${msg}` },
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

  function renderContent(text: string) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1.5">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          h1: ({ children }) => <h1 className="font-bold text-sm mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="font-semibold text-[13px] mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold mb-0.5">{children}</h3>,
          code: ({ children }) => <code className="bg-muted rounded px-1 py-0.5 text-[11px] font-mono">{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-2 text-muted-foreground italic mb-1">{children}</blockquote>,
          hr: () => <hr className="border-border my-1.5" />,
        }}
      >
        {text}
      </ReactMarkdown>
    );
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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
        title="Chat with the AI about this conversation"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold tracking-tight">Close</span>
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
              <Bot className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold tracking-tight">Resonance Chat</span>
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
            className="fixed bottom-[76px] right-6 z-50 flex flex-col w-[380px] h-[540px] rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Resonance Chat</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  Ask anything about this conversation
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
                      {(m as Message & { thinking?: boolean }).thinking ? (
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : m.content ? renderContent(m.content) : null}
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
                      onClick={() => {
                        setInput(s);
                        // Use a microtask so input state is set before send() reads it
                        setTimeout(() => {
                          setInput("");
                          const userMsg: Message = { role: "user", content: s };
                          const nextMessages = [...messages, userMsg];
                          setMessages([...nextMessages, { role: "model", content: "", thinking: true }]);
                          setLoading(true);
                          const historyForServer = nextMessages.filter(
                            (m, i) => !(i === 0 && m.role === "model")
                          );
                          fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ messages: historyForServer, context }),
                          })
                            .then((res) => res.json().then((data) => ({ res, data })))
                            .then(({ res, data }) => {
                              if (!res.ok) {
                                setMessages((prev) => [...prev.slice(0, -1), { role: "model", content: `⚠️ ${data.error ?? data.message ?? `Server error ${res.status}`}` }]);
                              } else {
                                setMessages((prev) => [...prev.slice(0, -1), { role: "model", content: data.reply ?? "⚠️ Empty response." }]);
                              }
                            })
                            .catch((err) => {
                              setMessages((prev) => [...prev.slice(0, -1), { role: "model", content: `⚠️ ${err instanceof Error ? err.message : "Network error"}` }]);
                            })
                            .finally(() => setLoading(false));
                        }, 0);
                      }}
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
