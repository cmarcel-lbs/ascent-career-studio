import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, RefreshCw, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { GeneratedResults } from "@/types/application";
import { toast } from "sonner";

interface TrackResultsProps {
  results: GeneratedResults;
  onReset: () => void;
  onRegenerate?: () => void;
}

export function TrackResults({ results, onReset, onRegenerate }: TrackResultsProps) {
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

  const scoreColor =
    results.insights.matchScore >= 80 ? "text-success" : results.insights.matchScore >= 60 ? "text-warning" : "text-destructive";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Generated Materials</h3>
        <Button onClick={onReset} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> New
        </Button>
      </div>

      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="bg-secondary/60 border border-border p-1 mb-4 w-full">
          <TabsTrigger value="resume" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground text-xs">Resume</TabsTrigger>
          <TabsTrigger value="cover-letter" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground text-xs">Cover Letter</TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground text-xs">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="resume">
          <div className="rounded-lg border border-border bg-card p-4">
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="min-h-[350px] bg-transparent border-0 p-0 resize-none text-xs font-mono leading-relaxed focus-visible:ring-0"
            />
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <Button size="sm" variant="outline" className="gap-1 text-xs border-border" onClick={() => copyToClipboard(resume, "Resume")}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-border" onClick={() => downloadText(resume, "resume.txt")}>
                <Download className="h-3 w-3" /> Download
              </Button>
              {onRegenerate && (
                <Button size="sm" variant="outline" className="gap-1 text-xs border-border" onClick={onRegenerate}>
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cover-letter">
          <div className="rounded-lg border border-border bg-card p-4">
            <Textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[300px] bg-transparent border-0 p-0 resize-none text-xs leading-relaxed focus-visible:ring-0"
            />
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <Button size="sm" variant="outline" className="gap-1 text-xs border-border" onClick={() => copyToClipboard(coverLetter, "Cover letter")}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-border" onClick={() => downloadText(coverLetter, "cover-letter.txt")}>
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Match Score</p>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-bold font-display ${scoreColor}`}>{results.insights.matchScore}</span>
                <span className="text-sm text-muted-foreground mb-0.5">/100</span>
              </div>
              <Progress value={results.insights.matchScore} className="h-1.5" />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Missing Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {results.insights.missingKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-normal">{kw}</Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggestions</p>
              <ul className="space-y-1.5">
                {results.insights.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-foreground">
                    <span className="text-accent mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Changes Made</p>
              <ul className="space-y-1.5">
                {results.insights.changesSummary.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
