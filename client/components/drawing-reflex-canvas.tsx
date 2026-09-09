import React, { useState, useRef, useEffect } from "react";
import {
  Brush,
  Square,
  Compass,
  Sparkles,
  Zap,
  Trash2,
  Download,
  Eye,
  Sliders,
  Shield,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Palette,
  Undo,
  Circle,
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
import { Slider } from "@/components/ui/slider";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface HabitReflexRule {
  id: string;
  triggerEvent: string;
  learnedAlternative: string;
  confidenceScore: number;
  timesInvoked: number;
}

export const DrawingReflexCanvas: React.FC = () => {
  const [drawTool, setDrawTool] = useState<"brush" | "rect" | "eraser">(
    "brush",
  );
  const [brushColor, setBrushColor] = useState("#38bdf8");
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const [habitRules, setHabitRules] = useState<HabitReflexRule[]>([
    {
      id: "h1",
      triggerEvent: "Dynamic Ad Popover Blocked Main Button",
      learnedAlternative:
        "Shift coordinate by +30px Y and execute escape key combo",
      confidenceScore: 0.96,
      timesInvoked: 14,
    },
    {
      id: "h2",
      triggerEvent: "Input Field Text Rejection on Single Type",
      learnedAlternative: "Prepend clear_and_type with double click focus lock",
      confidenceScore: 0.93,
      timesInvoked: 9,
    },
    {
      id: "h3",
      triggerEvent: "Exclusion Zone Intersect Detected",
      learnedAlternative:
        "Auto-reroute bezier spline curve around bounding box mask",
      confidenceScore: 0.98,
      timesInvoked: 21,
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);

  // Initialize canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 420;

    // Dark grid background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Save initial state
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (drawTool === "brush" || drawTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (drawTool === "brush") {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (drawTool === "eraser") {
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = brushSize * 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (drawTool === "rect" && startPos) {
      const coords = getCanvasCoords(e);
      const width = coords.x - startPos.x;
      const height = coords.y - startPos.y;

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = 2;
      ctx.fillStyle = `${brushColor}22`;
      ctx.strokeRect(startPos.x, startPos.y, width, height);
      ctx.fillRect(startPos.x, startPos.y, width, height);

      // Add as dynamic exclusion zone habit rule
      const newRule: HabitReflexRule = {
        id: `h-${Date.now()}`,
        triggerEvent: `Bounding Exclusion Zone (${Math.round(startPos.x)}, ${Math.round(startPos.y)}) [${Math.round(width)}×${Math.round(height)}]`,
        learnedAlternative:
          "Dynamic spline diversion with 15px waypoint clearance",
        confidenceScore: 0.99,
        timesInvoked: 1,
      };
      setHabitRules((prev) => [newRule, ...prev]);
    }

    // Save history for undo
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prevData = historyRef.current[historyRef.current.length - 1];

    const canvas = canvasRef.current;
    if (!canvas || !prevData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(prevData, 0, 0);
  };

  return (
    <div className="space-y-4">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="drawing"
        title="AI Drawing Tools & Dynamic Habit Reflex Canvas"
        badge="HTML5 Vector Drawing"
        settings={[
          {
            id: "habit_learning",
            label: "Auto-Learn Drawn Zones",
            type: "switch",
            value: true,
            description:
              "Convert drawn rectangles into obstacle avoidance rules",
          },
          {
            id: "brush_size",
            label: "Brush Stroke Thickness",
            type: "slider",
            value: brushSize,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            description: "Line width",
          },
          {
            id: "spline_smoothing",
            label: "Dynamic Spline Smoothing",
            type: "switch",
            value: true,
            description: "Smooth hand-drawn curves into cubic beziers",
          },
          {
            id: "render_exclusion",
            label: "Render Collision Mask",
            type: "switch",
            value: true,
            description: "Highlight avoidance bounding boxes",
          },
        ]}
        quickActions={[
          { label: "Undo Stroke", action: handleUndo, variant: "secondary" },
          {
            label: "Clear Canvas",
            action: handleClearCanvas,
            variant: "default",
          },
        ]}
        onSettingChange={(id, val) => {
          if (id === "brush_size") setBrushSize(Number(val));
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Drawing Controls & Habit Ledger */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Toolbox & Color Palette</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Tool Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  onClick={() => setDrawTool("brush")}
                  className={`h-8 text-xs font-mono font-bold ${drawTool === "brush" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
                >
                  <Brush className="w-3.5 h-3.5 mr-1" /> Brush
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDrawTool("rect")}
                  className={`h-8 text-xs font-mono font-bold ${drawTool === "rect" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}
                >
                  <Square className="w-3.5 h-3.5 mr-1" /> Box Zone
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDrawTool("eraser")}
                  className={`h-8 text-xs font-mono font-bold ${drawTool === "eraser" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"}`}
                >
                  Eraser
                </Button>
              </div>

              {/* Color Presets */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-300 font-bold block">
                  Preset Colors:
                </span>
                <div className="flex gap-2">
                  {[
                    { color: "#38bdf8", name: "Cyan" },
                    { color: "#a855f7", name: "Purple" },
                    { color: "#10b981", name: "Emerald" },
                    { color: "#f59e0b", name: "Amber" },
                    { color: "#ef4444", name: "Red" },
                    { color: "#ffffff", name: "White" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setBrushColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        brushColor === c.color
                          ? "border-white scale-125 ring-2 ring-cyan-400"
                          : "border-slate-800"
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Habit Learning Rules Ledger */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">
                    Learned Reflex Rules ({habitRules.length})
                  </span>
                  <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[9px]">
                    Active
                  </Badge>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {habitRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
                    >
                      <p className="text-slate-200 font-bold">
                        {rule.triggerEvent}
                      </p>
                      <p className="text-[10px] text-cyan-300">
                        Action: {rule.learnedAlternative}
                      </p>
                      <div className="flex justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>
                          Confidence: {(rule.confidenceScore * 100).toFixed(0)}%
                        </span>
                        <span>Invoked {rule.timesInvoked}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: HTML5 Drawing Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold font-mono text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>
                  Interactive AI Drawing Canvas (Draw Freehand or Boxes)
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUndo}
                  className="h-7 text-xs font-mono text-slate-300 hover:text-white"
                >
                  <Undo className="w-3.5 h-3.5 mr-1" /> Undo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearCanvas}
                  className="h-7 text-xs font-mono text-slate-300 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full h-[420px] cursor-crosshair block"
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>
                  Tool:{" "}
                  <strong className="text-cyan-400 uppercase">
                    {drawTool}
                  </strong>{" "}
                  | Color:{" "}
                  <strong style={{ color: brushColor }}>{brushColor}</strong>
                </span>
                <span>
                  Draw on canvas to establish exclusion masks and waypoints.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
