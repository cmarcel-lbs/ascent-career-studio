import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, Eye, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SavedVersion } from "@/hooks/useVersionHistory";
import type { GeneratedResults } from "@/types/application";

interface VersionHistoryPanelProps {
  versions: SavedVersion[];
  loading: boolean;
  onLoadVersion: (results: GeneratedResults) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function VersionHistoryPanel({ versions, loading, onLoadVersion, onDelete, onClose }: VersionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const trackLabels: Record<string, string> = {
    "investment-banking": "Investment Banking",
    "private-equity": "Private Equity",
    "venture-capital": "Venture Capital",
    "product-management": "Product Management",
    "growth-strategy": "Growth & Strategy",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-0 h-screen w-full max-w-md border-l border-border bg-background z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Version History</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading versions…</div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No saved versions yet. Generated materials will appear here.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {versions.map((v) => {
              const insights = v.insights as GeneratedResults["insights"];
              return (
                <div key={v.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1.5">
                        {trackLabels[v.career_track] ?? v.career_track}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent">{insights?.matchScore ?? "—"}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {v.job_description_snippet || "No description"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-border flex-1"
                      onClick={() => onLoadVersion({
                        resume: v.resume,
                        coverLetter: v.cover_letter,
                        applicationEmail: "",
                        insights,
                      })}
                    >
                      <Eye className="h-3 w-3" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-border text-destructive hover:text-destructive"
                      onClick={() => onDelete(v.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
