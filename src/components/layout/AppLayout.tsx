import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  FolderOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { JobsFeedPage } from "@/components/jobs/JobsFeedPage";
import { JobDetailPage } from "@/components/jobs/JobDetailPage";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { ResumesPage } from "@/components/resumes/ResumesPage";
import { StudioPage } from "@/components/studio/StudioPage";
import { TrackerPage } from "@/components/tracker/TrackerPage";

type Page = "dashboard" | "jobs" | "job-detail" | "profile" | "resumes" | "studio" | "tracker";

const NAV_ITEMS = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "jobs" as Page, label: "Jobs", icon: Briefcase },
  { id: "tracker" as Page, label: "Tracker", icon: ClipboardList },
  { id: "studio" as Page, label: "Studio", icon: FileText },
  { id: "resumes" as Page, label: "Resumes", icon: FolderOpen },
  { id: "profile" as Page, label: "Profile", icon: User },
];

export function AppLayout() {
  const { signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const navigateToJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentPage("job-detail");
  };

  const navigateToJobs = () => {
    setSelectedJobId(null);
    setCurrentPage("jobs");
  };

  const navigateToStudio = (jobDescription?: string) => {
    setCurrentPage("studio");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigateToJobs={navigateToJobs} onNavigateToJob={navigateToJob} />;
      case "jobs":
        return <JobsFeedPage onNavigateToJob={navigateToJob} onNavigateToStudio={navigateToStudio} />;
      case "job-detail":
        return selectedJobId ? (
          <JobDetailPage jobId={selectedJobId} onBack={navigateToJobs} onNavigateToStudio={navigateToStudio} />
        ) : (
          <JobsFeedPage onNavigateToJob={navigateToJob} onNavigateToStudio={navigateToStudio} />
        );
      case "profile":
        return <ProfilePage />;
      case "resumes":
        return <ResumesPage />;
      case "studio":
        return <StudioPage />;
      default:
        return <DashboardPage onNavigateToJobs={navigateToJobs} onNavigateToJob={navigateToJob} />;
    }
  };

  const activePage = currentPage === "job-detail" ? "jobs" : currentPage;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-r border-border bg-card/50 flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Career Studio
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full gap-2 text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <ScrollArea className="h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage + (selectedJobId || "")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </main>
    </div>
  );
}
