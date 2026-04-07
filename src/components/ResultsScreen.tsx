import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, RefreshCw, ChevronDown, ChevronUp, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GeneratedResults } from "@/types/application";
import { toast } from "sonner";

interface ResultsScreenProps {
  results: GeneratedResults;
  onReset: () => void;
}

export function ResultsScreen({ results, onReset }: ResultsScreenProps) {
  const [resume, setResume] = useState(results.resume);
  const [coverLetter, setCoverLetter] = useState(results.coverLetter);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreColor = results.insights.matchScore >= 80 ? "text-success" : results.insights.matchScore >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="min-h-screen px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-1">Your Materials</h2>
            <p className="text-muted-foreground text-sm">Review, edit, and export your tailored application documents.</p>
          </div>
          <Button onClick={onReset} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Start Over
          </Button>
        </div>

        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="bg-secondary/60 border border-border p-1 mb-6">
            <TabsTrigger value="resume" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground px-6">Resume</TabsTrigger>
            <TabsTrigger value="cover-letter" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground px-6">Cover Letter</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground px-6">Insights</TabsTrigger>
          </TabsList>

          {/* RESUME TAB */}
          <TabsContent value="resume">
            <div className="rounded-xl border border-border bg-card p-6">
              <Textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="min-h-[500px] bg-transparent border-0 p-0 resize-none text-sm font-mono leading-relaxed focus-visible:ring-0"
              />
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => copyToClipboard(resume, "Resume")}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => downloadText(resume, "resume.txt")}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => toast.info("Regeneration requires AI integration")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => toast.info("Conservative mode requires AI integration")}>
                  <ChevronDown className="h-3.5 w-3.5" /> More Conservative
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => toast.info("Aggressive mode requires AI integration")}>
                  <ChevronUp className="h-3.5 w-3.5" /> More Aggressive
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* COVER LETTER TAB */}
          <TabsContent value="cover-letter">
            <div className="rounded-xl border border-border bg-card p-6">
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="min-h-[400px] bg-transparent border-0 p-0 resize-none text-sm leading-relaxed focus-visible:ring-0"
              />
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => copyToClipboard(coverLetter, "Cover letter")}>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => downloadText(coverLetter, "cover-letter.txt")}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-border" onClick={() => toast.info("Regeneration requires AI integration")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="insights">
            <div className="space-y-6">
              {/* Match Score */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 font-body">Match Score</h3>
                <div className="flex items-end gap-3 mb-3">
                  <span className={`text-5xl font-bold font-display ${scoreColor}`}>{results.insights.matchScore}</span>
                  <span className="text-lg text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={results.insights.matchScore} className="h-2" />
              </div>

              {/* Missing Keywords */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 font-body">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {results.insights.missingKeywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="bg-secondary text-secondary-foreground font-normal">{kw}</Badge>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 font-body">Suggested Improvements</h3>
                <ul className="space-y-2">
                  {results.insights.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-accent mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Changes Summary */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 font-body">Changes Made</h3>
                <ul className="space-y-2">
                  {results.insights.changesSummary.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
