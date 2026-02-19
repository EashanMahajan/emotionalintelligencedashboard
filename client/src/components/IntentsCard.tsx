import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Intent } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface IntentsCardProps {
  intents: Intent[];
}

export function IntentsCard({ intents }: IntentsCardProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (!intents || intents.length === 0) return null;

  const displayedIntents = showAll ? intents : intents.slice(0, 8);
  const hasMore = intents.length > 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-bold">Detected Intents</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {displayedIntents.map((intent, index) => {
                const confidence = Math.round(intent.confidence * 100);
                const opacity = Math.max(0.5, intent.confidence);
                
                return (
                  <motion.div
                    key={intent.intent}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      variant="secondary"
                      className="px-3 py-1.5 text-sm font-medium hover:bg-blue-500/10 transition-colors"
                      style={{ opacity }}
                    >
                      <span className="mr-1.5">{intent.intent}</span>
                      <span className="text-xs text-muted-foreground">
                        {confidence}%
                      </span>
                    </Badge>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-xs text-muted-foreground hover:text-blue-500"
            >
              {showAll ? 'Show less' : `+${intents.length - 8} more intents`}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
