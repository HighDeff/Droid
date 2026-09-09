import React, { useState } from "react";
import {
  Link2,
  AppWindow,
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Compass,
  ArrowRight,
  TrendingUp,
  Download,
  TestTube2,
  FileCode,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export interface AttachedWindow {
  title: string;
  pid: number;
  processName: string;
  rect: { x: number; y: number; width: number; height: number };
  status: "attached" | "available";
}

export interface DetectedUIElement {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  testResult: "untested" | "passed" | "same_response" | "failed";
  pixelDiffScore?: number;
}

export const ProgramLinkerAttacher: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "attach" | "capture" | "features" | "test_runner"
  >("attach");
  const [attachedWindow, setAttachedWindow] = useState<AttachedWindow | null>({
    title: "Google Chrome - AI Vision Portal",
    pid: 14280,
    processName: "chrome.exe",
    rect: { x: 100, y: 50, width: 1400, height: 900 },
    status: "attached",
  });

  const [availableWindows, setAvailableWindows] = useState<AttachedWindow[]>([
    {
      title: "Google Chrome - AI Vision Portal",
      pid: 14280,
      processName: "chrome.exe",
      rect: { x: 100, y: 50, width: 1400, height: 900 },
      status: "attached",
    },
    {
      title: "Visual Studio Code - Master App",
      pid: 8920,
      processName: "code.exe",
      rect: { x: 0, y: 0, width: 1920, height: 1080 },
      status: "available",
    },
    {
      title: "Windows Terminal (PowerShell)",
      pid: 12044,
      processName: "wt.exe",
      rect: { x: 200, y: 200, width: 1100, height: 700 },
      status: "available",
    },
  ]);

  const [detectedElements, setDetectedElements] = useState<DetectedUIElement[]>(
    [
      {
        id: "el_1",
        label: "Search Input Box",
        x: 420,
        y: 180,
        width: 320,
        height: 40,
        testResult: "passed",
        pixelDiffScore: 42.8,
      },
      {
        id: "el_2",
        label: "Submit CTA Button",
        x: 760,
        y: 180,
        width: 120,
        height: 40,
        testResult: "passed",
        pixelDiffScore: 88.4,
      },
      {
        id: "el_3",
        label: "Navigation Dropdown Menu",
        x: 220,
        y: 80,
        width: 150,
        height: 35,
        testResult: "passed",
        pixelDiffScore: 61.2,
      },
      {
        id: "el_4",
        label: "Static Footer Label",
        x: 500,
        y: 840,
        width: 200,
        height: 30,
        testResult: "same_response",
        pixelDiffScore: 1.2,
      },
    ],
  );

  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(100);

  const handleRunAllTests = () => {
    setIsTestRunning(true);
    setTestProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setTestProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsTestRunning(false);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Attached Window
              </p>
              <h4 className="text-sm font-bold text-cyan-400 font-mono truncate max-w-[160px]">
                {attachedWindow ? attachedWindow.processName : "None"}
              </h4>
            </div>
            <Link2 className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Detected Elements
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                {detectedElements.length} Items
              </h4>
            </div>
            <Layers className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                UI Responsiveness
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                92.4% Active
              </h4>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Automated Test Runner
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                Ready
              </h4>
            </div>
            <TestTube2 className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Program Linker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Window Attachment Options */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AppWindow className="w-4 h-4 text-cyan-400" />
              <span>Running Windows & Processes</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Attach by window title, process name, or executable launch
            </CardDescription>
          </CardHeader>

          <CardContent className="p-3 space-y-3">
            <ScrollArea className="h-64 pr-1 space-y-2">
              <div className="space-y-2">
                {availableWindows.map((win) => (
                  <div
                    key={win.pid}
                    onClick={() => setAttachedWindow(win)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      attachedWindow?.pid === win.pid
                        ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40"
                        : "bg-slate-950/60 border-slate-800 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                        {win.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono py-0 text-cyan-300 border-cyan-800 bg-cyan-950"
                      >
                        PID: {win.pid}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Proc: {win.processName}</span>
                      <span>
                        {win.rect.width}×{win.rect.height}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono block">
                Launch Program & Auto-Attach:
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder="C:\Path\To\Program.exe"
                  className="h-8 text-xs bg-slate-950 border-slate-700"
                />
                <Button
                  size="sm"
                  className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Launch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Feature Scanner & Automated Test Runner */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <TestTube2 className="w-4 h-4" />
                    <span>Attached Window Feature Scanner & Test Runner</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300 font-mono">
                    Target:{" "}
                    <strong className="text-purple-300">
                      {attachedWindow?.title}
                    </strong>{" "}
                    ({attachedWindow?.rect.width}×{attachedWindow?.rect.height})
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleRunAllTests}
                    disabled={isTestRunning}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />{" "}
                    {isTestRunning
                      ? `Running Tests (${testProgress}%)`
                      : "Run Pixel-Diff Tests"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {detectedElements.map((el) => (
                <div
                  key={el.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    el.testResult === "passed"
                      ? "bg-slate-950/80 border-emerald-800/80"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-bold">
                        {el.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        at ({el.x}, {el.y}) [{el.width}×{el.height}]
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Pixel Diff Response:{" "}
                      <strong
                        className={
                          el.pixelDiffScore && el.pixelDiffScore > 10
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {el.pixelDiffScore}%
                      </strong>
                    </div>
                  </div>

                  <Badge
                    className={`text-[10px] font-mono capitalize ${
                      el.testResult === "passed"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {el.testResult.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
