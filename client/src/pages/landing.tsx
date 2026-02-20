import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, BarChart2, Mic, TrendingUp, Users, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ResonanceLogo } from "@/components/ResonanceLogo";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen overflow-hidden bg-background relative flex flex-col">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
              <ResonanceLogo className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/signin")}>Sign In</Button>
            <Button size="sm" onClick={() => setLocation("/signup")}>Sign Up</Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/try")}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Try Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content — vertically centered in remaining space */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6"
          >
            <BarChart2 className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Understand Every<br />Conversation
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-7">
            AI-powered conversation intelligence that reveals emotional dynamics, sentiment patterns, and insights from your audio recordings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={() => setLocation("/signup")} size="lg" className="px-8 h-12 text-base shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4 mr-2" />
              Get Started Free
            </Button>
            <Button onClick={() => setLocation("/try")} variant="outline" size="lg" className="px-8 h-12 text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              Try Now — No Account
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-5 w-full max-w-5xl"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Upload or Record</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload existing recordings or record conversations live. Supports multiple audio formats.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track emotional trajectories, detect conflicts, and identify conversation patterns.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Speaker Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Speaker-diarized transcripts with talk time, turn count, and sentiment per speaker.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
