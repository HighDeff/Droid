import React, { useState } from "react";
import {
  FileCode,
  FolderOpen,
  Sparkles,
  Zap,
  CheckCircle2,
  RotateCcw,
  Play,
  Download,
  History,
  GitBranch,
  Shield,
  Layers,
  ArrowRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";

export const AICodeEditorBackupStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(
    "python-service/automation.py",
  );
  const [codeContent, setCodeContent] = useState(`import pyautogui
import time

def human_mouse_move(x, y, duration=0.5):
    """Execute natural spline curve with micro-jitter."""
    pyautogui.moveTo(x, y, duration=duration, tween=pyautogui.easeInOutQuad)
    time.sleep(0.1)
`);

  const [aiDiffOutput, setAiDiffOutput] =
    useState(`--- python-service/automation.py (Original)
+++ python-service/automation.py (AI Refactored)
@@ -3,4 +3,7 @@
 def human_mouse_move(x, y, duration=0.5):
+    # Added error handling & bounds validation
+    if x < 0 or y < 0:
+        raise ValueError(f"Invalid screen coordinates: ({x}, {y})")
     pyautogui.moveTo(x, y, duration=duration, tween=pyautogui.easeInOutQuad)
`);

  const [isBackupCreated, setIsBackupCreated] = useState(false);

  const handleCreateDesktopBackup = () => {
    setIsBackupCreated(true);
    setTimeout(() => setIsBackupCreated(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Active Code File
              </p>
              <h4 className="text-sm font-bold text-cyan-400 font-mono truncate max-w-[160px]">
                {selectedFile.split("/").pop()}
              </h4>
            </div>
            <FileCode className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                AI Refactor Engine
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                Online
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-purple-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Auto-Backup Engine
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                Protected
              </h4>
            </div>
            <Shield className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Diff Comparison
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                Unified View
              </h4>
            </div>
            <GitBranch className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Code Editor & AI Diff Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor & Refactor Actions */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>{selectedFile}</span>
              </CardTitle>
              <Button
                size="sm"
                onClick={handleCreateDesktopBackup}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1"
              >
                <Download className="w-3 h-3" />{" "}
                {isBackupCreated ? "Backup Saved!" : "Backup to Desktop"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {/* Syntax Editor Box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 h-64 overflow-auto">
              <pre>{codeContent}</pre>
            </div>

            {/* AI Refactoring Quick Prompts */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 block font-mono">
                AI Refactor Quick Actions:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono"
                >
                  + Add Error Handling
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono"
                >
                  + Add Docstrings
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                >
                  ⚡ Refactor for Speed
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
                >
                  🔍 Find Subtle Bugs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: AI Unified Diff Viewer */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-purple-400 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>AI Unified Diff Inspector</span>
              </CardTitle>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Accept Diff
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white"
                >
                  Reject
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs h-72 overflow-auto text-slate-300 leading-relaxed">
              <pre className="text-emerald-400">{aiDiffOutput}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
