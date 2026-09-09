import React, { useState } from "react";
import {
  Monitor,
  MousePointer,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  Layers,
  Activity,
  Maximize2,
  FolderOpen,
  FileText,
  Trash2,
  Globe,
  Terminal,
  Settings,
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
import { Switch } from "@/components/ui/switch";

export interface SimulatedWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  content: string[];
}

export const VirtualDesktopMirrorStudio: React.FC = () => {
  const [syncRealMouseToCanvas, setSyncRealMouseToCanvas] = useState(true);
  const [canvasClickToRealMouse, setCanvasClickToRealMouse] = useState(false);
  const [aiCursorToRealMouse, setAiCursorToRealMouse] = useState(false);

  const [realMousePos, setRealMousePos] = useState({ x: 380, y: 220 });
  const [aiCursorPos, setAiCursorPos] = useState({ x: 540, y: 160 });
  const [canvasLocalPos, setCanvasLocalPos] = useState({ x: 260, y: 190 });

  const [desktopWindows, setDesktopWindows] = useState<SimulatedWindow[]>([
    {
      id: "win_1",
      title: "My Computer",
      x: 180,
      y: 40,
      width: 260,
      height: 180,
      isOpen: true,
      content: [
        "C:\ [Local Disk - 450 GB]",
        "D:\ [Fast NVMe SSD - 1 TB]",
        "E:\ [Network Share]",
      ],
    },
    {
      id: "win_2",
      title: "Terminal",
      x: 460,
      y: 80,
      width: 280,
      height: 180,
      isOpen: true,
      content: [
        "Microsoft Windows [Version 10.0]",
        "PS C:\Users\Dan> python automation.py",
        "AI Mouse Daemon Running...",
      ],
    },
  ]);

  const desktopIcons = [
    { label: "My Computer", icon: "🖥️", x: 20, y: 20 },
    { label: "Documents", icon: "📁", x: 20, y: 90 },
    { label: "Browser", icon: "🌐", x: 20, y: 160 },
    { label: "Terminal", icon: "⬛", x: 20, y: 230 },
    { label: "Settings", icon: "⚙️", x: 20, y: 300 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                🟦 Real Mouse (Pynput)
              </p>
              <h4 className="text-base font-bold text-blue-400 font-mono">
                ({realMousePos.x}, {realMousePos.y})
              </h4>
            </div>
            <MousePointer className="w-8 h-8 text-blue-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                🟩 AI Trajectory Cursor
              </p>
              <h4 className="text-base font-bold text-cyan-400 font-mono">
                ({aiCursorPos.x}, {aiCursorPos.y})
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-cyan-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                ⬜ Canvas Local Cursor
              </p>
              <h4 className="text-base font-bold text-slate-200 font-mono">
                ({canvasLocalPos.x}, {canvasLocalPos.y})
              </h4>
            </div>
            <MousePointer className="w-8 h-8 text-slate-400/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Active Windows
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                {desktopWindows.filter((w) => w.isOpen).length} Open
              </h4>
            </div>
            <Monitor className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Main Virtual Desktop Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 3-Way Bridge Controls Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Multi-Cursor Bridge Controls</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Toggle bidirectional synchronization between real OS and simulated
              desktop
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">
                  Sync Real Mouse → Canvas
                </span>
                <span className="text-[10px] text-slate-400">
                  Pynput listener mirrors OS cursor
                </span>
              </div>
              <Switch
                checked={syncRealMouseToCanvas}
                onCheckedChange={setSyncRealMouseToCanvas}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">
                  Canvas Click → Real Mouse
                </span>
                <span className="text-[10px] text-slate-400">
                  Drives PyAutoGUI on real display
                </span>
              </div>
              <Switch
                checked={canvasClickToRealMouse}
                onCheckedChange={setCanvasClickToRealMouse}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">
                  AI Cursor → Real Mouse
                </span>
                <span className="text-[10px] text-slate-400">
                  AI commands move physical cursor
                </span>
              </div>
              <Switch
                checked={aiCursorToRealMouse}
                onCheckedChange={setAiCursorToRealMouse}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Simulated Virtual Desktop Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Virtual Desktop Simulation Canvas</span>
                </CardTitle>
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono">
                  1920×1080 Normalized
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {/* Desktop Icons */}
                {desktopIcons.map((ic, idx) => (
                  <div
                    key={idx}
                    style={{ left: ic.x, top: ic.y }}
                    className="absolute flex flex-col items-center p-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-center"
                  >
                    <span className="text-xl">{ic.icon}</span>
                    <span className="text-[9px] font-mono text-slate-300 mt-0.5">
                      {ic.label}
                    </span>
                  </div>
                ))}

                {/* Simulated Windows */}
                {desktopWindows.map((win) => (
                  <div
                    key={win.id}
                    style={{
                      left: win.x,
                      top: win.y,
                      width: win.width,
                      height: win.height,
                    }}
                    className="absolute rounded-lg bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
                  >
                    <div className="h-6 bg-slate-800 px-2 flex items-center justify-between text-[10px] font-mono font-bold text-slate-200 border-b border-slate-700">
                      <span>{win.title}</span>
                      <span className="text-slate-400 hover:text-red-400 cursor-pointer">
                        ✕
                      </span>
                    </div>
                    <div className="p-2 text-[9px] font-mono text-slate-300 space-y-1 overflow-y-auto">
                      {win.content.map((c, i) => (
                        <p key={i}>{c}</p>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 3 Cursors Display */}
                {/* 1. Real Mouse (Blue) */}
                <div
                  style={{ left: realMousePos.x, top: realMousePos.y }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-950/90 border border-blue-400 px-1.5 py-0.5 rounded text-[9px] font-mono text-blue-200 shadow-lg"
                >
                  <MousePointer className="w-3 h-3 text-blue-400 fill-blue-400" />
                  <span>Real</span>
                </div>

                {/* 2. AI Cursor (Cyan) */}
                <div
                  style={{ left: aiCursorPos.x, top: aiCursorPos.y }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-cyan-950/90 border border-cyan-400 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-200 shadow-lg"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>AI</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
