import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, BarChart2, Mic, TrendingUp, Users, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ResonanceLogo } from "@/components/ResonanceLogo";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
              <ResonanceLogo className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/signin")}>
              Sign In
            </Button>
            <Button onClick={() => setLocation("/signup")}>
              Sign Up
            </Button>
            <Button variant="outline" onClick={() => setLocation("/try")}>
              <Sparkles className="w-4 h-4 mr-2" />
              Try Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6"
          >
            <BarChart2 className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            Understand Every<br />Conversation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-powered conversation intelligence that reveals emotional dynamics, sentiment patterns, and insights from your audio recordings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setLocation("/signup")}
              size="lg"
              className="h-14 px-8 text-lg shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button
              onClick={() => setLocation("/try")}
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Try Now - No Account
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
              <Mic className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Upload or Record</h3>
            <p className="text-muted-foreground">
              Upload existing recordings or record conversations live. Supports multiple audio formats.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Sentiment Analysis</h3>
            <p className="text-muted-foreground">
              Track emotional trajectories, detect conflicts, and identify conversation patterns.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Speaker Insights</h3>
            <p className="text-muted-foreground">
              Speaker-diarized transcripts with talk time, turn count, and sentiment per speaker.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
