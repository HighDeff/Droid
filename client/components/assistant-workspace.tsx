import {
  Activity,
  Archive,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileImage,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  MoreHorizontal,
  PanelRight,
  Play,
  Plus,
  ScanSearch,
  Settings2,
  Sparkles,
  Target,
  Upload,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Link, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CaptureSourcePanel } from "./capture-source-panel";

export type AssistantView =
  | "workspace"
  | "captures"
  | "operations"
  | "accomplishments";

export interface AssistantWorkspaceState {
  selectedProjectId: string;
  selectedSessionId: string;
  captureCount: number;
  completedSteps: number;
  totalSteps: number;
  lastUpdated: string;
}

export interface AssistantWorkspaceProps {
  view?: AssistantView;
  state?: Partial<AssistantWorkspaceState>;
  onStateChange?: (state: AssistantWorkspaceState) => void;
}

const defaultState: AssistantWorkspaceState = {
  selectedProjectId: "research-sprint",
  selectedSessionId: "checkout-flow",
  captureCount: 24,
  completedSteps: 3,
  totalSteps: 5,
  lastUpdated: "Just now",
};

const navigation = [
  { label: "Workspace", path: "/workspace", icon: LayoutDashboard },
  { label: "Captures", path: "/captures", icon: Camera },
  { label: "Operations", path: "/operations", icon: Workflow },
  { label: "Accomplishments", path: "/accomplishments", icon: Archive },
];

const sessions = [
  { name: "Checkout flow", detail: "24 captures", active: true },
  { name: "Settings audit", detail: "8 captures", active: false },
  { name: "Onboarding pass", detail: "Draft", active: false },
];

const timeline = [
  { label: "Capture", detail: "Screen ready", status: "done" },
  { label: "OCR pass", detail: "Text detected", status: "done" },
  { label: "Context", detail: "Instruction added", status: "done" },
  { label: "Review", detail: "Waiting for you", status: "current" },
  { label: "Export", detail: "Not started", status: "next" },
];

function getViewFromPath(pathname: string): AssistantView {
  if (pathname.startsWith("/captures")) return "captures";
  if (pathname.startsWith("/operations")) return "operations";
  if (pathname.startsWith("/accomplishments")) return "accomplishments";
  return "workspace";
}

export function AssistantWorkspace({
  view,
  state: stateOverride,
}: AssistantWorkspaceProps) {
  const location = useLocation();
  const activeView = view ?? getViewFromPath(location.pathname);
  const state = { ...defaultState, ...stateOverride };
  const progressValue = Math.round(
    (state.completedSteps / Math.max(state.totalSteps, 1)) * 100,
  );

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#10172a] lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-5">
            <Link to="/workspace" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-[#07111e] shadow-lg shadow-cyan-400/20">
                <ScanSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Sightline
                </p>
                <p className="text-[11px] text-slate-500">
                  AI assistant workspace
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="hidden px-3 lg:block">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>
            <nav className="space-y-1">
              {navigation.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    activeView === getViewFromPath(path)
                      ? "bg-cyan-400/10 font-medium text-cyan-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {label === "Captures" && (
                    <span className="ml-auto text-xs text-slate-500">
                      {state.captureCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
            {navigation.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs",
                  activeView === getViewFromPath(path)
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-slate-400",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden flex-1 px-3 pt-8 lg:block">
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Sessions
              </p>
              <button
                className="text-slate-500 transition-colors hover:text-cyan-300"
                aria-label="Add session"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.name}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    session.active ? "bg-white/5" : "hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 rounded-full",
                      session.active ? "bg-cyan-300" : "bg-slate-700",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-200">
                      {session.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {session.detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden border-t border-white/10 p-4 lg:block">
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-slate-400 hover:bg-white/5 hover:text-white">
              <Settings2 className="h-4 w-4" />
              <span className="text-sm">Workspace settings</span>
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-medium text-slate-200">
                    Research sprint
                  </h1>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">
                  {state.lastUpdated} ·{" "}
                  {state.selectedSessionId.replace("-", " ")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden border-emerald-400/20 bg-emerald-400/10 text-emerald-300 sm:inline-flex">
                <Activity className="mr-1 h-3 w-3" /> Ready
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Help"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-bold text-slate-950">
                DS
              </div>
            </div>
          </header>

          <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 p-5 sm:p-8">
              <div className="mx-auto max-w-5xl">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
                      Live workspace
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {activeView === "workspace"
                        ? "Make sense of your screen."
                        : navigation.find(
                            (item) => getViewFromPath(item.path) === activeView,
                          )?.label}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                      {activeView === "workspace"
                        ? "Capture a moment, add an instruction, and keep the important context close at hand."
                        : "A structured placeholder for the next layer of your OCR assistant workflow."}
                    </p>
                  </div>
                  <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                    <Camera className="h-4 w-4" /> Capture screen
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121b31] shadow-2xl shadow-black/20">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Screen preview
                      <span className="text-slate-600">/</span>
                      {activeView === "captures"
                        ? "Capture library"
                        : "Active canvas"}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                        aria-label="Upload capture"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex min-h-[330px] items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1),_transparent_45%)] p-6 sm:min-h-[430px]">
                    <div className="w-full max-w-2xl rounded-xl border border-dashed border-cyan-300/30 bg-[#0d1528]/80 p-8 text-center">
                      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                        {activeView === "captures" ? (
                          <FileImage className="h-7 w-7" />
                        ) : (
                          <ScanSearch className="h-7 w-7" />
                        )}
                      </div>
                      <h3 className="text-base font-medium text-slate-200">
                        {activeView === "workspace"
                          ? "Your live screen will appear here"
                          : `${navigation.find((item) => getViewFromPath(item.path))?.label} are ready to connect`}
                      </h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        This calm, focused canvas is reserved for real capture
                        data, OCR regions, and assistant output once the state
                        layer is connected.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-4 w-4" /> Add a placeholder capture
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "Captured today",
                      value: state.captureCount,
                      icon: Camera,
                    },
                    { label: "OCR confidence", value: "—", icon: ScanSearch },
                    { label: "Open decisions", value: "2", icon: Lightbulb },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <p className="mt-4 text-xl font-semibold text-slate-100">
                        {value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="border-t border-white/10 bg-[#0f1729] p-5 sm:p-8 xl:border-l xl:border-t-0">
              <div className="mx-auto max-w-xl xl:mx-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PanelRight className="h-4 w-4 text-cyan-300" />
                    <h2 className="text-sm font-medium text-slate-200">
                      Instruction & context
                    </h2>
                  </div>
                  <button
                    className="text-slate-500 hover:text-slate-200"
                    aria-label="Close context panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-sm leading-6 text-slate-200">
                        Find the primary action and tell me what needs
                        attention.
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Placeholder instruction · editable later
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  <CaptureSourcePanel />
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-300">
                        Context sources
                      </p>
                      <button className="text-xs text-cyan-300 hover:text-cyan-200">
                        Manage
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          label: "Current screen",
                          detail: "Live preview",
                          icon: MonitorIcon,
                        },
                        {
                          label: "Session notes",
                          detail: "3 notes",
                          icon: ListChecks,
                        },
                        {
                          label: "Project goals",
                          detail: "2 goals",
                          icon: Target,
                        },
                      ].map(({ label, detail, icon: Icon }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                        >
                          <Icon className="h-4 w-4 text-slate-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-slate-300">
                              {label}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {detail}
                            </p>
                          </div>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-300">
                        Assistant readiness
                      </p>
                      <span className="text-xs text-cyan-300">
                        {progressValue}%
                      </span>
                    </div>
                    <Progress
                      value={progressValue}
                      className="mt-3 h-1.5 bg-slate-800 [&>div]:bg-cyan-300"
                    />
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Connect a capture source to unlock OCR and structured
                      suggestions.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-6 w-full border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Play className="h-4 w-4" /> Prepare assistant run
                </Button>
              </div>
            </aside>
          </div>

          <footer className="border-t border-white/10 bg-[#10172a] px-5 py-4 sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-cyan-300" />
                <div>
                  <p className="text-xs font-medium text-slate-300">
                    Session progress
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {state.completedSteps} of {state.totalSteps} checkpoints
                    complete
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto lg:ml-8">
                {timeline.map((item, index) => (
                  <div
                    key={item.label}
                    className="flex min-w-max items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
                          item.status === "done" &&
                            "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                          item.status === "current" &&
                            "border-cyan-300/40 bg-cyan-300/10 text-cyan-300",
                          item.status === "next" &&
                            "border-white/10 text-slate-600",
                        )}
                      >
                        {item.status === "done" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="hidden sm:block">
                        <span className="block text-[11px] text-slate-300">
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-slate-600">
                          {item.detail}
                        </span>
                      </span>
                    </div>
                    {index < timeline.length - 1 && (
                      <span className="h-px w-6 bg-white/10 sm:w-10" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" /> Saved{" "}
                {state.lastUpdated.toLowerCase()}
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function MonitorIcon(props: ComponentProps<typeof FileImage>) {
  return <FileImage {...props} />;
}
