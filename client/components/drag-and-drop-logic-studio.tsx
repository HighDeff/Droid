import React, { useState, useRef, useEffect } from "react";
import {
  Move,
  Hand,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Play,
  Layers,
  Activity,
  Crosshair,
  ArrowRight,
  TrendingUp,
  Maximize2,
  MousePointer,
  Send,
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

export interface DraggableItem {
  id: string;
  name: string;
  type: "puzzle_tile" | "file_card" | "slider_thumb" | "control_box";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  assignedZone: string | null;
}

export interface DropZone {
  id: string;
  name: string;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  acceptedType: string;
  isOccupied: boolean;
}

export const DragAndDropLogicStudio: React.FC = () => {
  const [items, setItems] = useState<DraggableItem[]>([
    {
      id: "item_1",
      name: "CAPTCHA Puzzle Tile",
      type: "puzzle_tile",
      x: 40,
      y: 50,
      width: 150,
      height: 60,
      color: "from-cyan-600 to-blue-600",
      assignedZone: null,
    },
    {
      id: "item_2",
      name: "User Auth Payload Token",
      type: "file_card",
      x: 40,
      y: 130,
      width: 150,
      height: 60,
      color: "from-purple-600 to-indigo-600",
      assignedZone: null,
    },
    {
      id: "item_3",
      name: "Verification Slider Thumb",
      type: "slider_thumb",
      x: 40,
      y: 210,
      width: 150,
      height: 60,
      color: "from-emerald-600 to-teal-600",
      assignedZone: null,
    },
  ]);

  const [dropZones, setDropZones] = useState<DropZone[]>([
    {
      id: "zone_1",
      name: "Puzzle Slot (Slot #1)",
      targetX: 380,
      targetY: 50,
      width: 170,
      height: 70,
      acceptedType: "puzzle_tile",
      isOccupied: false,
    },
    {
      id: "zone_2",
      name: "Auth Bucket (Bucket #2)",
      targetX: 380,
      targetY: 130,
      width: 170,
      height: 70,
      acceptedType: "file_card",
      isOccupied: false,
    },
    {
      id: "zone_3",
      name: "Slider Endpoint (100%)",
      targetX: 380,
      targetY: 210,
      width: 170,
      height: 70,
      acceptedType: "slider_thumb",
      isOccupied: false,
    },
  ]);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dragSpeedMs, setDragSpeedMs] = useState(350);
  const [snapTolerancePx, setSnapTolerancePx] = useState(35);
  const [lastActionLog, setLastActionLog] = useState<string>(
    "Ready for interactive mouse dragging.",
  );

  const canvasRef = useRef<HTMLDivElement>(null);

  // Pointer Down to pick up an item
  const handlePointerDown = (e: React.PointerEvent, item: DraggableItem) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setActiveDragId(item.id);
    setDragOffset({
      x: clientX - item.x,
      y: clientY - item.y,
    });
    setLastActionLog(
      `Picked up "${item.name}" at (${Math.round(item.x)}, ${Math.round(item.y)})`,
    );
  };

  // Pointer Move to drag item
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(
      10,
      Math.min(rect.width - 160, e.clientX - rect.left - dragOffset.x),
    );
    const newY = Math.max(
      10,
      Math.min(rect.height - 70, e.clientY - rect.top - dragOffset.y),
    );

    setItems((prev) =>
      prev.map((it) =>
        it.id === activeDragId ? { ...it, x: newX, y: newY } : it,
      ),
    );
  };

  // Pointer Up to drop and test snap-to-grid
  const handlePointerUp = () => {
    if (!activeDragId) return;
    const draggedItem = items.find((it) => it.id === activeDragId);
    if (!draggedItem) {
      setActiveDragId(null);
      return;
    }

    // Check collision with drop zones
    let matchedZone: DropZone | null = null;
    for (const zone of dropZones) {
      const distX = Math.abs(draggedItem.x - zone.targetX);
      const distY = Math.abs(draggedItem.y - zone.targetY);
      if (distX < snapTolerancePx + 40 && distY < snapTolerancePx + 30) {
        matchedZone = zone;
        break;
      }
    }

    if (matchedZone) {
      // Snap to center of drop zone
      setItems((prev) =>
        prev.map((it) =>
          it.id === activeDragId
            ? {
                ...it,
                x: matchedZone!.targetX + 10,
                y: matchedZone!.targetY + 5,
                assignedZone: matchedZone!.id,
              }
            : it,
        ),
      );
      setDropZones((prev) =>
        prev.map((z) =>
          z.id === matchedZone!.id ? { ...z, isOccupied: true } : z,
        ),
      );
      setLastActionLog(
        `✓ Snapped "${draggedItem.name}" into "${matchedZone.name}" with snap tolerance ±${snapTolerancePx}px`,
      );
    } else {
      setLastActionLog(
        `Dropped "${draggedItem.name}" at (${Math.round(draggedItem.x)}, ${Math.round(draggedItem.y)})`,
      );
    }

    setActiveDragId(null);
  };

  const handleReset = () => {
    setItems([
      {
        id: "item_1",
        name: "CAPTCHA Puzzle Tile",
        type: "puzzle_tile",
        x: 40,
        y: 50,
        width: 150,
        height: 60,
        color: "from-cyan-600 to-blue-600",
        assignedZone: null,
      },
      {
        id: "item_2",
        name: "User Auth Payload Token",
        type: "file_card",
        x: 40,
        y: 130,
        width: 150,
        height: 60,
        color: "from-purple-600 to-indigo-600",
        assignedZone: null,
      },
      {
        id: "item_3",
        name: "Verification Slider Thumb",
        type: "slider_thumb",
        x: 40,
        y: 210,
        width: 150,
        height: 60,
        color: "from-emerald-600 to-teal-600",
        assignedZone: null,
      },
    ]);
    setDropZones((prev) => prev.map((z) => ({ ...z, isOccupied: false })));
    setLastActionLog("Canvas reset to baseline coordinates.");
  };

  const handleAutoSolveAll = () => {
    setItems((prev) =>
      prev.map((it, idx) => ({
        ...it,
        x: dropZones[idx].targetX + 10,
        y: dropZones[idx].targetY + 5,
        assignedZone: dropZones[idx].id,
      })),
    );
    setDropZones((prev) => prev.map((z) => ({ ...z, isOccupied: true })));
    setLastActionLog(
      "⚡ AI Auto-Solved all 3 drag-and-drop targets with PyAutoGUI cubic spline trajectories.",
    );
  };

  return (
    <div className="space-y-4 select-none">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="drag-drop"
        title="Interactive Drag & Drop Physics & Snap Studio"
        badge="Pointer Physics Active"
        settings={[
          {
            id: "snap_enabled",
            label: "Magnetic Snap-to-Grid",
            type: "switch",
            value: true,
            description: "Auto-snap when within tolerance",
          },
          {
            id: "snap_tolerance",
            label: "Snap Magnetism Tolerance",
            type: "slider",
            value: snapTolerancePx,
            min: 10,
            max: 60,
            step: 5,
            unit: "px",
            description: "Distance threshold",
          },
          {
            id: "drag_speed",
            label: "AI Drag Duration",
            type: "slider",
            value: dragSpeedMs,
            min: 100,
            max: 1500,
            step: 50,
            unit: "ms",
            description: "PyAutoGUI travel speed",
          },
          {
            id: "visual_trail",
            label: "Render Drag Motion Trail",
            type: "switch",
            value: true,
            description: "Show animated trajectory",
          },
        ]}
        quickActions={[
          {
            label: "AI Auto-Solve",
            action: handleAutoSolveAll,
            variant: "default",
          },
          { label: "Reset Canvas", action: handleReset, variant: "secondary" },
        ]}
        onSettingChange={(id, val) => {
          if (id === "snap_tolerance") setSnapTolerancePx(Number(val));
          if (id === "drag_speed") setDragSpeedMs(Number(val));
        }}
      />

      {/* Main Drag & Drop Interactive Canvas */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold font-mono text-slate-100 flex items-center gap-2">
              <Hand className="w-4 h-4 text-cyan-400" />
              <span>
                Interactive Drag & Drop Sandbox (Click & Drag Any Tile)
              </span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-300 font-mono">
              Use your mouse pointer to grab, drag, and drop items into target
              zones with live magnetic snapping.
            </CardDescription>
          </div>
          <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-xs font-mono">
            {dropZones.filter((z) => z.isOccupied).length} / {dropZones.length}{" "}
            Zones Locked
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Interactive Sandbox Canvas */}
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair"
          >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Target Drop Zones */}
            {dropZones.map((zone) => (
              <div
                key={zone.id}
                style={{
                  left: `${zone.targetX}px`,
                  top: `${zone.targetY}px`,
                  width: `${zone.width}px`,
                  height: `${zone.height}px`,
                }}
                className={`absolute rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                  zone.isOccupied
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-lg shadow-emerald-950/50"
                    : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-cyan-500 hover:bg-cyan-950/20"
                }`}
              >
                <span className="text-[10px] font-mono font-bold">
                  {zone.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {zone.isOccupied ? "✓ LOCKED" : "TARGET ZONE"}
                </span>
              </div>
            ))}

            {/* Draggable Items */}
            {items.map((item) => {
              const isDragging = activeDragId === item.id;
              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item)}
                  style={{
                    transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                  className={`absolute top-0 left-0 rounded-xl p-2.5 shadow-xl flex items-center justify-between cursor-grab active:cursor-grabbing font-mono transition-transform duration-75 bg-gradient-to-r ${item.color} ${
                    isDragging
                      ? "ring-4 ring-cyan-400 scale-105 z-30 shadow-2xl opacity-90"
                      : item.assignedZone
                        ? "ring-2 ring-emerald-400 z-10"
                        : "z-20 hover:scale-102"
                  }`}
                >
                  <div className="space-y-0.5 pointer-events-none">
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-slate-200">
                      ({Math.round(item.x)}, {Math.round(item.y)})
                    </p>
                  </div>
                  <Move className="w-4 h-4 text-white/80 pointer-events-none" />
                </div>
              );
            })}
          </div>

          {/* Action Log / Status Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              <strong>Telemetry:</strong> {lastActionLog}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAutoSolveAll}
                className="h-7 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Execute Native PyAutoGUI
                Drag
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-7 text-xs font-mono border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
