import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryCardProps {
  summary: string | any;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  // Handle both string and object formats
  let summaryText: string | undefined;
  
  if (typeof summary === 'string') {
    summaryText = summary;
  } else if (summary && typeof summary === 'object') {
    // Handle old format where summary was an object
    // Only extract from 'short' field - 'result' is a status field, not the summary
    summaryText = summary.short;
  }
  
  if (!summaryText || typeof summaryText !== 'string') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">AI Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-base leading-relaxed text-foreground">
              {summaryText}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
