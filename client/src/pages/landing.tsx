import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6"
          >
            <BarChart2 className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Emotional Intelligence AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Analyze conversations, detect sentiment, and gain insights from your audio recordings.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-lg mx-auto">
          {/* Create Account Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 mx-auto">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-3">Create Account</h2>
              <p className="text-muted-foreground text-center mb-6 flex-1">
                Start analyzing conversations and unlock emotional intelligence insights.
              </p>
              <Button
                onClick={() => setLocation("/signup")}
                className="w-full h-11"
                size="lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </motion.div>

          {/* Sign In Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-6 mx-auto">
                <LogIn className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-3">Sign In</h2>
              <p className="text-muted-foreground text-center mb-6 flex-1">
                Welcome back! Sign in to access your dashboard and analyses.
              </p>
              <Button
                onClick={() => setLocation("/signin")}
                variant="outline"
                className="w-full h-11"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
