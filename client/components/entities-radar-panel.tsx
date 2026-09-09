import React, { useState, useEffect } from "react";
import {
  Crosshair,
  Target,
  Shield,
  Eye,
  Zap,
  Filter,
  Sliders,
  Play,
  RotateCcw,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Search,
  Scan,
  Send,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface TacticalEntity {
  id: string;
  type:
    | "goal_target"
    | "workflow_context"
    | "distractor"
    | "input"
    | "button"
    | "modal";
  name: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  confidence: number;
  relevanceScore: number;
  category: "accepted" | "context" | "rejected";
  reasoning: string;
  screenshotOrigin?: string;
}

interface EntitiesRadarPanelProps {
  entities?: TacticalEntity[];
  userGoal?: string;
  onSelectEntity?: (x: number, y: number, name: string) => void;
  onLockFocus?: (x: number, y: number, name: string) => void;
  onDispatchAiMove?: (entity: TacticalEntity) => void;
}

export const EntitiesRadarPanel: React.FC<EntitiesRadarPanelProps> = ({
  entities: initialEntities,
  userGoal = "Submit User Authentication Form & Advance to Dashboard",
  onSelectEntity,
  onLockFocus,
  onDispatchAiMove,
}) => {
  const [entities, setEntities] = useState<TacticalEntity[]>([
    {
      id: "ent-1",
      type: "goal_target",
      name: "Submit & Continue Primary CTA Button",
      position: { x: 740, y: 520 },
      width: 180,
      height: 48,
      confidence: 0.98,
      relevanceScore: 0.97,
      category: "accepted",
      reasoning:
        "Directly satisfies Milestone #3: advances workflow to dashboard with 98% OCR exact text match.",
      screenshotOrigin: "Current Live Screen (Step #3)",
    },
    {
      id: "ent-2",
      type: "goal_target",
      name: "User Passcode Input Field #1",
      position: { x: 420, y: 380 },
      width: 260,
      height: 40,
      confidence: 0.95,
      relevanceScore: 0.94,
      category: "accepted",
      reasoning:
        "Focused by previous Virtual Keyboard input verifier. Ready for submission.",
      screenshotOrigin: "Current Live Screen (Step #3)",
    },
    {
      id: "ent-3",
      type: "workflow_context",
      name: "Header Navigation Breadcrumb 'Settings > Security'",
      position: { x: 210, y: 80 },
      width: 320,
      height: 30,
      confidence: 0.89,
      relevanceScore: 0.65,
      category: "context",
      reasoning:
        "Parent container context identified during initial page load hierarchy scan.",
      screenshotOrigin: "Previous Step Screenshot (Step #2)",
    },
    {
      id: "ent-4",
      type: "distractor",
      name: "Sponsored Banner Advertisement Overlay",
      position: { x: 880, y: 140 },
      width: 300,
      height: 250,
      confidence: 0.92,
      relevanceScore: 0.08,
      category: "rejected",
      reasoning:
        "Excluded: Third-party iframe ad banner. Does not contribute to authentication goal.",
      screenshotOrigin: "Current Live Screen (Step #3)",
    },
    {
      id: "ent-5",
      type: "distractor",
      name: "Unrelated 'Cancel & Discard' Secondary Button",
      position: { x: 310, y: 520 },
      width: 140,
      height: 44,
      confidence: 0.88,
      relevanceScore: 0.12,
      category: "rejected",
      reasoning: "Excluded: Abort action would invalidate user workflow state.",
      screenshotOrigin: "Current Live Screen (Step #3)",
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<
    "all" | "accepted" | "context" | "rejected"
  >("accepted");
  const [minConfidence, setMinConfidence] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<TacticalEntity | null>(
    entities[0],
  );
  const [aiMovementDispatchLog, setAiMovementDispatchLog] = useState<
    string | null
  >(null);

  // Sync if prop updates
  useEffect(() => {
    if (initialEntities && initialEntities.length > 0) {
      setEntities(initialEntities);
      setSelectedEntity(initialEntities[0]);
    }
  }, [initialEntities]);

  const filteredEntities = entities.filter((e) => {
    if (activeCategory !== "all" && e.category !== activeCategory) return false;
    if (e.confidence * 100 < minConfidence) return false;
    if (
      searchQuery &&
      !e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleScanEntities = () => {
    const newEnt: TacticalEntity = {
      id: `ent-${Date.now()}`,
      type: "goal_target",
      name: "Dynamic Confirmation Dialog 'OK'",
      position: {
        x: 500 + Math.floor(Math.random() * 100),
        y: 400 + Math.floor(Math.random() * 80),
      },
      width: 120,
      height: 38,
      confidence: 0.94,
      relevanceScore: 0.91,
      category: "accepted",
      reasoning:
        "Freshly discovered modal trigger advancing active user goal path.",
      screenshotOrigin: "Real-Time 60Hz Vision Stream",
    };
    setEntities((prev) => [newEnt, ...prev]);
    setSelectedEntity(newEnt);
  };

  const handleTellAiToMove = async (entity: TacticalEntity) => {
    const log = `[DISPATCH] Main AI commanded to MOVE to (${entity.position.x}, ${entity.position.y}) targeting "${entity.name}". Reason: ${entity.reasoning}`;
    setAiMovementDispatchLog(log);
    // Real pyautogui dispatch - ensure AI actually performs
    try {
      await fetch("/api/execute-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDevice: "desktop",
          task: {
            id: `entity_move_${entity.id}_${Date.now()}`,
            name: `Move to ${entity.name}`,
            action: "click",
            targetPosition: { x: entity.position.x, y: entity.position.y },
            textPayload: "",
          },
        }),
      });
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "PyAutoGUI",
          level: "SUCCESS",
          message: `Entity radar dispatched @ (${entity.position.x},${entity.position.y}) - ${entity.name}`,
        }),
      }).catch(() => {});
    } catch {}
    onDispatchAiMove?.(entity);
    onSelectEntity?.(entity.position.x, entity.position.y, entity.name);
  };

  return (
    <div className="space-y-4">
      {/* Contextual Settings & Feature Bar */}
      <TabContextualSettingsBar
        tabType="entities"
        title="Tactical Entity Detection & Goal Cross-Referencing Radar"
        badge="Vision OCR Cross-Ref"
        settings={[
          {
            id: "auto_cross_ref",
            label: "Auto Cross-Reference Goal",
            type: "switch",
            value: true,
            description: "Filter entities against active workflow objectives",
          },
          {
            id: "distractor_suppression",
            label: "Auto-Suppress Distractors",
            type: "switch",
            value: true,
            description: "Isolate irrelevant ads, popups & dead links",
          },
          {
            id: "confidence_threshold",
            label: "Confidence Threshold",
            type: "slider",
            value: minConfidence,
            min: 30,
            max: 99,
            step: 1,
            unit: "%",
            description: "Perception cutoff",
          },
          {
            id: "spatial_radar_overlay",
            label: "Render 2D Radar Canvas",
            type: "switch",
            value: true,
            description: "Show polar coordinates and bounding boxes",
          },
        ]}
        quickActions={[
          {
            label: "Trigger OCR Radar",
            action: handleScanEntities,
            variant: "default",
          },
          {
            label: "Clear Distractors",
            action: () =>
              setEntities((prev) =>
                prev.filter((e) => e.category !== "rejected"),
              ),
            variant: "secondary",
          },
        ]}
        onSettingChange={(id, val) => {
          if (id === "confidence_threshold") setMinConfidence(Number(val));
        }}
      />

      {/* Overarching User Goal & AI Reason Banner */}
      <Card className="bg-slate-900/95 border-slate-800 shadow-xl overflow-hidden">
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Active User Overarching Goal
            </span>
            <p className="text-xs font-bold text-slate-100 font-mono">
              {userGoal}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-xs font-mono py-1">
              ✓ {entities.filter((e) => e.category === "accepted").length}{" "}
              Goal-Accepted
            </Badge>
            <Badge className="bg-red-950 text-red-300 border-red-800 text-xs font-mono py-1">
              ✕ {entities.filter((e) => e.category === "rejected").length}{" "}
              Distractors Filtered
            </Badge>
          </div>
        </div>

        {/* Live AI Movement Dispatcher Notification */}
        {aiMovementDispatchLog && (
          <div className="p-3 bg-cyan-950/50 border-b border-cyan-800/80 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-cyan-200 font-bold">
                {aiMovementDispatchLog}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAiMovementDispatchLog(null)}
              className="h-6 text-[10px] text-cyan-400 hover:text-white"
            >
              Dismiss
            </Button>
          </div>
        )}
      </Card>

      {/* Main Grid: Radar Canvas & Entity Separation Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 2D Radar & Visual Positioning */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>2D Spatial Entity Radar</span>
                </CardTitle>
                <span className="text-[10px] font-mono text-slate-400">
                  1920×1080 Viewport
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative w-full aspect-square max-h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/4 rounded-full border border-slate-800/60" />
                  <div className="w-1/2 h-1/2 rounded-full border border-slate-800/80" />
                  <div className="w-1/4 h-1/4 rounded-full border border-cyan-900/60" />
                  <div className="absolute w-full h-[1px] bg-slate-800/60" />
                  <div className="absolute h-full w-[1px] bg-slate-800/60" />
                </div>

                {/* Render Entity Radar Blips */}
                {entities.map((ent) => {
                  const isSelected = selectedEntity?.id === ent.id;
                  const posX = (ent.position.x / 1000) * 100;
                  const posY = (ent.position.y / 800) * 100;
                  const colorClass =
                    ent.category === "accepted"
                      ? "bg-emerald-500 border-emerald-300 shadow-emerald-500/50"
                      : ent.category === "context"
                        ? "bg-purple-500 border-purple-300 shadow-purple-500/50"
                        : "bg-red-500/60 border-red-400 shadow-red-500/20";

                  return (
                    <button
                      key={ent.id}
                      onClick={() => {
                        setSelectedEntity(ent);
                        onSelectEntity?.(
                          ent.position.x,
                          ent.position.y,
                          ent.name,
                        );
                      }}
                      style={{
                        left: `${Math.min(92, Math.max(8, posX))}%`,
                        top: `${Math.min(92, Math.max(8, posY))}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border shadow-lg transition-all transform hover:scale-125 ${colorClass} ${
                        isSelected
                          ? "ring-4 ring-cyan-400 scale-125 z-20"
                          : "z-10"
                      }`}
                      title={`${ent.name} (${ent.position.x}, ${ent.position.y})`}
                    >
                      <Crosshair className="w-3 h-3 text-slate-950" />
                    </button>
                  );
                })}

                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-[9px] font-mono text-slate-300">
                  <span>🟢 Accepted | 🟣 Context | 🔴 Distractor</span>
                </div>
              </div>

              {/* Selected Entity Inspector & Dispatch Button */}
              {selectedEntity && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {selectedEntity.name}
                    </span>
                    <Badge
                      className={`text-[10px] ${
                        selectedEntity.category === "accepted"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : selectedEntity.category === "context"
                            ? "bg-purple-950 text-purple-300 border-purple-800"
                            : "bg-red-950 text-red-300 border-red-800"
                      }`}
                    >
                      {selectedEntity.category.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                    <div>
                      Coordinates:{" "}
                      <strong className="text-cyan-300">
                        ({selectedEntity.position.x},{" "}
                        {selectedEntity.position.y})
                      </strong>
                    </div>
                    <div>
                      Confidence:{" "}
                      <strong className="text-emerald-400">
                        {(selectedEntity.confidence * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="col-span-2">
                      Source:{" "}
                      <span className="text-slate-300">
                        {selectedEntity.screenshotOrigin}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900 text-[10px] text-slate-300 border-l-2 border-cyan-500">
                    <strong>AI Rationale:</strong> {selectedEntity.reasoning}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleTellAiToMove(selectedEntity)}
                      className="flex-1 h-8 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Tell Main AI to Move
                      Here
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onLockFocus?.(
                          selectedEntity.position.x,
                          selectedEntity.position.y,
                          selectedEntity.name,
                        )
                      }
                      className="h-8 text-xs font-mono border-slate-700"
                    >
                      Lock Focus
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 3-Way Cross-Referenced Separation Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-400" />
                  <span>Cross-Referenced Entity Separation Matrix</span>
                </CardTitle>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveCategory("accepted")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      activeCategory === "accepted"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "text-slate-300 hover:text-slate-200"
                    }`}
                  >
                    🎯 Goal-Accepted (
                    {entities.filter((e) => e.category === "accepted").length})
                  </button>
                  <button
                    onClick={() => setActiveCategory("context")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      activeCategory === "context"
                        ? "bg-purple-950 text-purple-300 border border-purple-800"
                        : "text-slate-300 hover:text-slate-200"
                    }`}
                  >
                    🗂️ Context (
                    {entities.filter((e) => e.category === "context").length})
                  </button>
                  <button
                    onClick={() => setActiveCategory("rejected")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      activeCategory === "rejected"
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "text-slate-300 hover:text-slate-200"
                    }`}
                  >
                    🛑 Distractors (
                    {entities.filter((e) => e.category === "rejected").length})
                  </button>
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      activeCategory === "all"
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter entities by name or OCR match..."
                  className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 font-mono"
                />
              </div>

              {/* Entities List */}
              <ScrollArea className="h-96">
                <div className="space-y-2 pr-2">
                  {filteredEntities.map((ent) => {
                    const isSelected = selectedEntity?.id === ent.id;
                    return (
                      <div
                        key={ent.id}
                        onClick={() => setSelectedEntity(ent)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/50"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1.5">
                            {ent.category === "accepted" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : ent.category === "context" ? (
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            )}
                            {ent.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-cyan-400">
                            ({ent.position.x}, {ent.position.y})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 font-mono line-clamp-2">
                          {ent.reasoning}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[9px] font-mono text-slate-400">
                          <span>
                            Relevance: {(ent.relevanceScore * 100).toFixed(0)}%
                          </span>
                          <span>
                            Confidence: {(ent.confidence * 100).toFixed(0)}%
                          </span>
                          <span>{ent.screenshotOrigin}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTellAiToMove(ent);
                            }}
                            className="h-5 px-2 text-[9px] font-mono text-cyan-400 hover:text-white"
                          >
                            Move →
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
