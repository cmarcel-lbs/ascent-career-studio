import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const STAGES = [
  "Analyzing job description",
  "Applying career-specific logic",
  "Generating tailored resume",
  "Generating cover letter",
];

export function ProcessingScreen() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-6">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Generating Your Materials</h2>
        <p className="text-muted-foreground text-sm mb-8">This typically takes 15–30 seconds</p>

        <motion.p
          key={currentStage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-sm text-accent font-medium"
        >
          {STAGES[currentStage]}...
        </motion.p>
      </motion.div>
    </div>
  );
}
