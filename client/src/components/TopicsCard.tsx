import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Topic } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TopicsCardProps {
  topics: Topic[];
}

export function TopicsCard({ topics }: TopicsCardProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (!topics || topics.length === 0) return null;

  const displayedTopics = showAll ? topics : topics.slice(0, 8);
  const hasMore = topics.length > 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Tag className="w-5 h-5 text-purple-500" />
            </div>
            <CardTitle className="text-xl font-bold">Key Topics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {displayedTopics.map((topic, index) => {
                const confidence = Math.round(topic.confidence * 100);
                const opacity = Math.max(0.5, topic.confidence);
                
                return (
                  <motion.div
                    key={topic.topic}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      variant="secondary"
                      className="px-3 py-1.5 text-sm font-medium hover:bg-purple-500/10 transition-colors"
                      style={{ opacity }}
                    >
                      <span className="mr-1.5">{topic.topic}</span>
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
              className="mt-3 text-xs text-muted-foreground hover:text-purple-500"
            >
              {showAll ? 'Show less' : `+${topics.length - 8} more topics`}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
