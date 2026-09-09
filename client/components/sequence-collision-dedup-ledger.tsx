import React, { useState } from "react";
import {
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  Trash2,
  Sliders,
  Database,
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

export interface MemorizedSequenceRecord {
  id: string;
  sequenceHash: string;
  targetDescription: string;
  coordinates: { x: number; y: number };
  executedTimes: number;
  lastExecutedTime: string;
  isRepetitiveLoop: boolean;
  collisionDetectedWithPeer: boolean;
  status: "memorized" | "loop_blocked" | "peer_synchronized";
}

export const SequenceCollisionDedupLedger: React.FC = () => {
  const [sequences, setSequences] = useState<MemorizedSequenceRecord[]>([
    {
      id: "seq_1",
      sequenceHash: "hash_focus_input_600_450",
      targetDescription: "Focus Username Input Field",
      coordinates: { x: 600, y: 450 },
      executedTimes: 1,
      lastExecutedTime: "11:08:12",
      isRepetitiveLoop: false,
      collisionDetectedWithPeer: false,
      status: "peer_synchronized",
    },
    {
      id: "seq_2",
      sequenceHash: "hash_click_disabled_btn_960_742",
      targetDescription: "Repeated Click on Inactive CTA Button",
      coordinates: { x: 960, y: 742 },
      executedTimes: 3,
      lastExecutedTime: "11:08:16",
      isRepetitiveLoop: true,
      collisionDetectedWithPeer: false,
      status: "loop_blocked",
    },
    {
      id: "seq_3",
      sequenceHash: "hash_captcha_tile_drag_800_420",
      targetDescription: "CAPTCHA Tile Drag Coordinate",
      coordinates: { x: 800, y: 420 },
      executedTimes: 1,
      lastExecutedTime: "11:08:20",
      isRepetitiveLoop: false,
      collisionDetectedWithPeer: false,
      status: "peer_synchronized",
    },
  ]);

  const handleClearSequences = () => {
    setSequences([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Memorized Sequences
              </p>
              <h4 className="text-xl font-bold text-cyan-400 font-mono">
                {sequences.length} Hashes
              </h4>
            </div>
            <Database className="w-8 h-8 text-cyan-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Repetitive Loops Blocked
              </p>
              <h4 className="text-xl font-bold text-amber-400 font-mono">
                1 Prevented
              </h4>
            </div>
            <ShieldAlert className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Peer Sync Broadcast
              </p>
              <h4 className="text-xl font-bold text-emerald-400 font-mono">
                Active (2 Peers)
              </h4>
            </div>
            <Radio className="w-8 h-8 text-emerald-500/40 animate-pulse" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-slate-300">
                Collision Avoidance
              </p>
              <h4 className="text-xl font-bold text-purple-400 font-mono">
                100% Clean
              </h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Sequence De-duplication Ledger Table */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>
                  Auto-Memorizing Sequence De-duplication & Collision Ledger
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Prevents redundant dead-zone clicks and broadcasts sequence
                hashes to avoid multi-agent collisions
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSequences}
              className="h-7 text-xs text-red-400 hover:bg-red-950/30"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                seq.status === "loop_blocked"
                  ? "bg-amber-950/40 border-amber-800/80"
                  : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">
                    {seq.targetDescription}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 capitalize ${
                      seq.status === "loop_blocked"
                        ? "text-amber-300 border-amber-700 bg-amber-950"
                        : "text-emerald-300 border-emerald-800 bg-emerald-950"
                    }`}
                  >
                    {seq.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-300">
                  <span>Hash: {seq.sequenceHash}</span>
                  <span>
                    Pos: ({seq.coordinates.x}, {seq.coordinates.y})
                  </span>
                  <span>
                    Exec Count: <strong>{seq.executedTimes}x</strong>
                  </span>
                  <span>Last Seen: {seq.lastExecutedTime}</span>
                </div>
              </div>

              {seq.isRepetitiveLoop && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-900/60 px-2 py-1 rounded">
                  Loop Suppressed
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
