import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const STAGES = [
  "Analyzing job description",
  "Applying career-specific logic",
  "Generating tailored resume",
  "Generating cover letter",
];

interface ProcessingScreenProps {
  onComplete: () => void;
}

export function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentStage(i + 1), (i + 1) * 1400));
    });
    timers.push(setTimeout(onComplete, STAGES.length * 1400 + 800));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-6">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Generating Your Materials</h2>
          <p className="text-muted-foreground text-sm">This typically takes a few moments</p>
        </div>

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone = currentStage > i;
            const isActive = currentStage === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-3"
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isDone ? "bg-success" : isActive ? "bg-primary" : "bg-secondary"
                }`}>
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-success-foreground" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span className={`text-sm transition-colors duration-300 ${
                  isDone ? "text-foreground" : isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}>
                  {stage}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
