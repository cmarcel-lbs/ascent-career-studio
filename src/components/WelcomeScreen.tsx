import { motion } from "framer-motion";
import { ArrowRight, FileText, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStart: () => void;
}

const features = [
  { icon: FileText, title: "ATS-Optimized", desc: "Tailored for applicant tracking systems" },
  { icon: Target, title: "Career-Specific", desc: "Logic tuned per industry vertical" },
  { icon: Sparkles, title: "Style-Aware", desc: "Learns from your best past materials" },
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-2xl text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          CAREER APPLICATION STUDIO
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
          Create career-specific resumes and cover letters in minutes
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
          Tailor every application using job descriptions, career-specific logic, and your own best past materials.
        </p>

        <Button
          onClick={onStart}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-medium gap-2 rounded-lg"
        >
          Start
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl w-full"
      >
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/60">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 font-body">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
