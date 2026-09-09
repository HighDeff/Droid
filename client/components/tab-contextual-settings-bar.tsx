import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  Zap,
  Shield,
  RotateCcw,
  Settings2,
  Gauge,
  Cpu,
  Eye,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export interface TabSettingItem {
  id: string;
  label: string;
  type: "switch" | "slider" | "select" | "button";
  value: boolean | number | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export interface TabContextualSettingsBarProps {
  tabType: string;
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  settings: TabSettingItem[];
  quickActions?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
  }>;
  onSettingChange?: (id: string, value: any) => void;
}

export const TabContextualSettingsBar: React.FC<
  TabContextualSettingsBarProps
> = ({
  tabType,
  title,
  icon,
  badge,
  settings: initialSettings,
  quickActions = [],
  onSettingChange,
}) => {
  const [settings, setSettings] = useState<TabSettingItem[]>(initialSettings);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggleSwitch = (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: newVal } : s)),
    );
    onSettingChange?.(id, newVal);
  };

  const handleSliderChange = (id: string, val: number) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: val } : s)),
    );
    onSettingChange?.(id, val);
  };

  return (
    <Card className="bg-slate-900/95 border-slate-800 shadow-xl mb-4 overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon || <Settings2 className="w-4 h-4 text-cyan-400" />}
          <span className="text-xs font-bold text-slate-100 font-mono tracking-wide">
            {title} — Contextual Settings & Active Controls
          </span>
          {badge && (
            <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px] font-mono py-0">
              {badge}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {quickActions.map((qa, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={qa.variant || "secondary"}
              onClick={qa.action}
              className="h-6 text-[10px] font-mono font-bold px-2 py-0"
            >
              {qa.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 text-[10px] font-mono text-slate-300 hover:text-slate-200 px-1.5"
          >
            {isExpanded ? "Collapse Controls" : "Expand Controls"}
          </Button>
        </div>
      </div>

      {/* Settings Grid */}
      {isExpanded && (
        <CardContent className="p-3.5 bg-slate-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {settings.map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-200">
                    {st.label}
                  </span>
                  {st.type === "switch" && (
                    <Switch
                      checked={Boolean(st.value)}
                      onCheckedChange={() =>
                        handleToggleSwitch(st.id, Boolean(st.value))
                      }
                    />
                  )}
                  {st.type === "slider" && (
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      {String(st.value)} {st.unit || ""}
                    </span>
                  )}
                </div>

                {st.type === "slider" && (
                  <Slider
                    value={[typeof st.value === "number" ? st.value : 50]}
                    min={st.min || 0}
                    max={st.max || 100}
                    step={st.step || 1}
                    onValueChange={([v]) => handleSliderChange(st.id, v)}
                  />
                )}

                {st.description && (
                  <p className="text-[9px] font-mono text-slate-400 line-clamp-1">
                    {st.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
