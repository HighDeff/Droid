import React, { useState } from "react";
import {
  Cpu,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  HardDrive,
  Activity,
  Layers,
  RefreshCw,
  Server,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Radio,
  Clock,
  Shield,
  Bot,
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
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface ModelProfile {
  id: string;
  name: string;
  type: "gguf_local" | "ollama" | "qwen_vl" | "deepseek_r1" | "claude_sonnet";
  filePathOrEndpoint: string;
  quantization?: string;
  gpuLayers: number;
  contextSize: number;
  temperature: number;
  vramUsageGb: number;
  throughputTokensPerSec: number;
  status: "loaded" | "ready" | "offloaded";
}

interface GGUFModelEngineStudioProps {
  onModelSelected?: (model: ModelProfile) => void;
}

export const GGUFModelEngineStudio: React.FC<GGUFModelEngineStudioProps> = ({
  onModelSelected,
}) => {
  const [models, setModels] = useState<ModelProfile[]>([
    {
      id: "m_gguf_qwen",
      name: "Qwen 2.5-VL 7B Instruct (GGUF Q4_K_M)",
      type: "gguf_local",
      filePathOrEndpoint: "models/qwen2.5-vl-7b-instruct.Q4_K_M.gguf",
      quantization: "Q4_K_M (4.8 GB)",
      gpuLayers: 28,
      contextSize: 32768,
      temperature: 0.2,
      vramUsageGb: 5.4,
      throughputTokensPerSec: 42.8,
      status: "loaded",
    },
    {
      id: "m_gguf_deepseek",
      name: "DeepSeek R1 Distill Qwen 8B (GGUF Q5_K_M)",
      type: "deepseek_r1",
      filePathOrEndpoint: "models/deepseek-r1-distill-qwen-8b.Q5_K_M.gguf",
      quantization: "Q5_K_M (5.6 GB)",
      gpuLayers: 32,
      contextSize: 65536,
      temperature: 0.6,
      vramUsageGb: 6.2,
      throughputTokensPerSec: 38.4,
      status: "ready",
    },
    {
      id: "m_ollama_local",
      name: "Ollama Local Daemon",
      type: "ollama",
      filePathOrEndpoint: "http://localhost:11434",
      quantization: "FP16 / Native",
      gpuLayers: 33,
      contextSize: 16384,
      temperature: 0.1,
      vramUsageGb: 4.8,
      throughputTokensPerSec: 54.2,
      status: "ready",
    },
    {
      id: "m_claude_cloud",
      name: "Claude 3.7 Sonnet Multi-Modal Vision",
      type: "claude_sonnet",
      filePathOrEndpoint: "api.anthropic.com/v1",
      quantization: "Cloud Ultra",
      gpuLayers: 0,
      contextSize: 128000,
      temperature: 0.2,
      vramUsageGb: 0,
      throughputTokensPerSec: 85.0,
      status: "ready",
    },
  ]);

  const [activeModelId, setActiveModelId] = useState<string>("m_gguf_qwen");
  const [gpuLayers, setGpuLayers] = useState<number>(28);
  const [contextSize, setContextSize] = useState<number>(32768);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [customModelPath, setCustomModelPath] = useState<string>(
    "models/custom-model.gguf",
  );
  const [statusLog, setStatusLog] = useState<string>(
    "GGUF & Multi-Model Engine active. Model loaded in VRAM.",
  );

  const activeModel = models.find((m) => m.id === activeModelId) || models[0];

  const handleSelectModel = (modelId: string) => {
    setActiveModelId(modelId);
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        status: m.id === modelId ? "loaded" : "ready",
      })),
    );
    const selected = models.find((m) => m.id === modelId);
    if (selected) {
      setStatusLog(`✓ Switched active model to: ${selected.name}`);
      if (onModelSelected) onModelSelected(selected);
    }
  };

  const handleAddCustomGGUF = () => {
    const newModel: ModelProfile = {
      id: `m_custom_${Date.now()}`,
      name: `Custom GGUF (${customModelPath.split("/").pop() || "model.gguf"})`,
      type: "gguf_local",
      filePathOrEndpoint: customModelPath,
      quantization: "Auto Detect",
      gpuLayers,
      contextSize,
      temperature,
      vramUsageGb: 5.0,
      throughputTokensPerSec: 35.0,
      status: "ready",
    };
    setModels((prev) => [...prev, newModel]);
    setStatusLog(`✓ Registered custom GGUF model: ${customModelPath}`);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="models"
        title="GGUF Local Model Engine, Multi-Model Switcher & VRAM Allocator"
        badge={`Active: ${activeModel.name.slice(0, 24)}...`}
        settings={[
          {
            id: "gpu_offload",
            label: "GPU Offload Layers (CUDA / Metal)",
            type: "slider",
            value: gpuLayers,
            min: 0,
            max: 33,
            step: 1,
            unit: "layers",
            description: "VRAM layer allocation",
          },
          {
            id: "ctx_size",
            label: "Context Window Capacity",
            type: "slider",
            value: contextSize,
            min: 4096,
            max: 131072,
            step: 4096,
            unit: "tokens",
            description: "Input sequence memory",
          },
          {
            id: "temp",
            label: "Model Temperature Sampling",
            type: "slider",
            value: temperature * 100,
            min: 0,
            max: 100,
            step: 5,
            unit: "%",
            description: "Creativity vs precision",
          },
          {
            id: "flash_attn",
            label: "Flash Attention & KV Cache Quant",
            type: "switch",
            value: true,
            description: "Optimize memory bandwidth",
          },
        ]}
        quickActions={[
          {
            label: "Switch to DeepSeek R1 🚀",
            action: () => handleSelectModel("m_gguf_deepseek"),
            variant: "default",
          },
          {
            label: "Switch to Qwen 2.5-VL ⚡",
            action: () => handleSelectModel("m_gguf_qwen"),
            variant: "secondary",
          },
        ]}
      />

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((m) => {
          const isActive = m.id === activeModelId;
          return (
            <Card
              key={m.id}
              onClick={() => handleSelectModel(m.id)}
              className={`bg-slate-900 border cursor-pointer transition-all shadow-xl flex flex-col justify-between ${
                isActive
                  ? "border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-950/60 scale-102"
                  : "border-slate-800 hover:border-slate-700 opacity-85"
              }`}
            >
              <CardHeader className="p-3 pb-2 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-mono ${
                      m.type.includes("gguf")
                        ? "text-purple-300 border-purple-800 bg-purple-950/40"
                        : m.type === "deepseek_r1"
                          ? "text-amber-300 border-amber-800 bg-amber-950/40"
                          : "text-cyan-300 border-cyan-800 bg-cyan-950/40"
                    }`}
                  >
                    {m.type.replace("_", " ")}
                  </Badge>
                  <Badge
                    className={`text-[9px] font-mono ${
                      isActive
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800 animate-pulse"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isActive ? "ACTIVE LOADED" : "STANDBY"}
                  </Badge>
                </div>
                <CardTitle className="text-xs font-bold text-slate-100 truncate mt-1">
                  {m.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-3 space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Quantization:</span>
                    <span className="text-slate-200 font-bold">
                      {m.quantization || "Native"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>VRAM Usage:</span>
                    <span className="text-cyan-300 font-bold">
                      {m.vramUsageGb} GB
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Throughput:</span>
                    <span className="text-emerald-400 font-bold">
                      {m.throughputTokensPerSec} tok/s
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectModel(m.id);
                  }}
                  className={`w-full h-7 text-[10px] font-mono font-bold ${
                    isActive
                      ? "bg-cyan-600 text-white hover:bg-cyan-500"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isActive ? "Active Model in Use ✓" : "Switch to Model ➔"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom GGUF File Loader Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800">
          <CardTitle className="text-xs font-bold text-purple-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span>Load Local GGUF Model from Filesystem</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              value={customModelPath}
              onChange={(e) => setCustomModelPath(e.target.value)}
              placeholder="e.g. C:/AI/models/llama-3.2-vision-11b.Q4_K_M.gguf"
              className="h-8 text-xs bg-slate-950 border-slate-800 font-mono text-cyan-300 flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddCustomGGUF}
              className="h-8 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Load GGUF Model
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Status Bar */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300">
          <strong>Model Engine Telemetry:</strong> {statusLog}
        </span>
      </div>
    </div>
  );
};
