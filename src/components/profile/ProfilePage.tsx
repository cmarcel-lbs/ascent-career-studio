import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { CAREER_TRACKS } from "@/types/application";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { profile, loading, saveProfile } = useProfile();
  const [summary, setSummary] = useState("");
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [targetSeniority, setTargetSeniority] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [preferredFunctions, setPreferredFunctions] = useState<string[]>([]);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [excludedJobTypes, setExcludedJobTypes] = useState<string[]>([]);
  const [preferredTracks, setPreferredTracks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSummary(profile.summary);
      setTargetLocations(profile.target_locations);
      setTargetSeniority(profile.target_seniority);
      setTargetIndustries(profile.target_industries);
      setPreferredFunctions(profile.preferred_functions);
      setHardSkills(profile.hard_skills);
      setExcludedJobTypes(profile.excluded_job_types);
      setPreferredTracks(profile.preferred_career_tracks);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile({
      summary,
      target_locations: targetLocations,
      target_seniority: targetSeniority,
      target_industries: targetIndustries,
      preferred_functions: preferredFunctions,
      hard_skills: hardSkills,
      excluded_job_types: excludedJobTypes,
      preferred_career_tracks: preferredTracks,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground">Define your career preferences to improve job matching.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Master Profile Summary</CardTitle>
            <CardDescription>A brief overview of your background and goals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Finance professional with 3 years in investment banking, seeking PE or VC roles..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferred Career Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CAREER_TRACKS.map((t) => (
                <Badge
                  key={t.value}
                  variant={preferredTracks.includes(t.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setPreferredTracks((prev) =>
                      prev.includes(t.value) ? prev.filter((v) => v !== t.value) : [...prev, t.value]
                    );
                  }}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <TagInputCard title="Hard Skills" description="Technical skills and competencies" tags={hardSkills} setTags={setHardSkills} placeholder="e.g. Financial Modeling, Python, SQL..." />
        <TagInputCard title="Target Locations" description="Where you want to work" tags={targetLocations} setTags={setTargetLocations} placeholder="e.g. New York, London, San Francisco..." />
        <TagInputCard title="Target Seniority" description="Levels you're targeting" tags={targetSeniority} setTags={setTargetSeniority} placeholder="e.g. Analyst, Associate, VP..." />
        <TagInputCard title="Target Industries" description="Industries of interest" tags={targetIndustries} setTags={setTargetIndustries} placeholder="e.g. Technology, Healthcare, Financial Services..." />
        <TagInputCard title="Preferred Functions" description="Functional areas you prefer" tags={preferredFunctions} setTags={setPreferredFunctions} placeholder="e.g. M&A, Growth, Product Strategy..." />
        <TagInputCard title="Excluded Job Types" description="Types you want to filter out" tags={excludedJobTypes} setTags={setExcludedJobTypes} placeholder="e.g. Sales, Data Entry..." />
      </div>
    </div>
  );
}

function TagInputCard({
  title,
  description,
  tags,
  setTags,
  placeholder,
}: {
  title: string;
  description: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
              />
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
