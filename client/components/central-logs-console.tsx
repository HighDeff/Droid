import React, { useState, useEffect } from "react";
import {
  FileText,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Terminal,
  RotateCcw,
  Sliders,
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  source:
    | "Qwen Vision"
    | "Planner AI"
    | "Mouse Tracker"
    | "PyAutoGUI"
    | "Verifier"
    | "Goals Hub"
    | "System";
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
}

export const CentralLogsConsole: React.FC = () => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([
    {
      id: "1",
      timestamp: Date.now() - 8000,
      timeStr: "03:45:10",
      source: "System",
      level: "INFO",
      message:
        "Unified AI Master Platform online (1920x1080 resolution active)",
    },
    {
      id: "2",
      timestamp: Date.now() - 6000,
      timeStr: "03:45:12",
      source: "Qwen Vision",
      level: "SUCCESS",
      message:
        "Grounded 3 interactive UI targets with 96% perception confidence",
    },
    {
      id: "3",
      timestamp: Date.now() - 4000,
      timeStr: "03:45:14",
      source: "Planner AI",
      level: "INFO",
      message:
        "Formulated Chain-of-Thought: targeting central input area with clear_and_type",
    },
    {
      id: "4",
      timestamp: Date.now() - 2000,
      timeStr: "03:45:16",
      source: "Mouse Tracker",
      level: "SUCCESS",
      message:
        "60 FPS velocity tracking synchronized (speed: 340 px/s, popup auto-removal active)",
    },
    {
      id: "5",
      timestamp: Date.now() - 500,
      timeStr: "03:45:18",
      source: "Verifier",
      level: "SUCCESS",
      message: "Post-execution frame similarity verified at 96.4%",
    },
  ]);

  // Live poll backend logs every 2s for real recording trace
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/logs?limit=100");
        const j = await r.json();
        if (j.success && Array.isArray(j.logs) && j.logs.length > 0) {
          setLogs(j.logs);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    if (filterSource !== "all" && log.source !== filterSource) return false;
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (
      searchQuery &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getLevelBadge = (level: SystemLogEntry["level"]) => {
    switch (level) {
      case "SUCCESS":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono text-emerald-300 bg-emerald-950 border-emerald-800"
          >
            SUCCESS
          </Badge>
        );
      case "WARN":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono text-amber-300 bg-amber-950 border-amber-800"
          >
            WARN
          </Badge>
        );
      case "ERROR":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono text-red-300 bg-red-950 border-red-800"
          >
            ERROR
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono text-cyan-300 bg-cyan-950 border-cyan-800"
          >
            INFO
          </Badge>
        );
    }
  };

  const handleExportLogs = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `master_app_logs_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Central Multi-Agent Event & Telemetry Console</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Live unified log matrix streaming events from Vision, Planner,
              Mouse Tracker, and Native Executors
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportLogs}
              className="h-7 text-xs border-slate-700 gap-1 text-slate-300 hover:text-white"
            >
              <Download className="w-3 h-3" /> Export Logs
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLogs([])}
              className="h-7 text-xs text-red-400 hover:bg-red-950/30"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/80">
          <Input
            placeholder="Search log messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs bg-slate-950 border-slate-700"
          />

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="h-7 text-xs bg-slate-950 border-slate-700">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-xs">
              <SelectItem value="all">All Subsystems</SelectItem>
              <SelectItem value="Qwen Vision">Qwen Vision</SelectItem>
              <SelectItem value="Planner AI">Planner AI</SelectItem>
              <SelectItem value="Mouse Tracker">Mouse Tracker</SelectItem>
              <SelectItem value="PyAutoGUI">PyAutoGUI</SelectItem>
              <SelectItem value="Verifier">Verifier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="h-7 text-xs bg-slate-950 border-slate-700">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-xs">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="h-[460px] pr-2 rounded-lg bg-slate-950/80 border border-slate-800/80 p-3 font-mono text-xs">
          <div className="space-y-1.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between gap-3 border border-slate-800/40"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {log.timeStr}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold whitespace-nowrap">
                    {log.source}
                  </span>
                  <span className="text-slate-200 truncate">{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
