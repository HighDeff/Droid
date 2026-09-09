import React, { useState } from "react";
import {
  Smartphone,
  Wifi,
  Battery,
  Layers,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  Sparkles,
  Download,
  Terminal,
  RefreshCw,
  Eye,
  Sliders,
  Radio,
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
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";
import { audioSynthesizer } from "@/lib/audio-synthesizer";

export interface AndroidDeviceCard {
  id: string;
  model: string;
  serial: string;
  connectionType: "usb" | "wifi";
  batteryLevel: number;
  resolution: string;
  status: "online" | "syncing" | "offline";
  activeApp: string;
  isSelectedForBroadcast: boolean;
}

export const AndroidAdbMultiDeviceGrid: React.FC = () => {
  const [isBroadcastMode, setIsBroadcastMode] = useState<boolean>(true);
  const [shellCmd, setShellCmd] = useState<string>("input tap 540 960");
  const [statusLog, setStatusLog] = useState<string>(
    "ADB Multi-Device Grid ready. 3 Android devices connected.",
  );

  const [devices, setDevices] = useState<AndroidDeviceCard[]>([
    {
      id: "dev_1",
      model: "Pixel 8 Pro",
      serial: "192.168.1.104:5555",
      connectionType: "wifi",
      batteryLevel: 92,
      resolution: "1080x2400",
      status: "online",
      activeApp: "com.android.settings",
      isSelectedForBroadcast: true,
    },
    {
      id: "dev_2",
      model: "Galaxy S24 Ultra",
      serial: "R5CW10ABCDE",
      connectionType: "usb",
      batteryLevel: 84,
      resolution: "1440x3120",
      status: "online",
      activeApp: "com.game.sample",
      isSelectedForBroadcast: true,
    },
    {
      id: "dev_3",
      model: "Android Emulator (x86_64)",
      serial: "emulator-5554",
      connectionType: "usb",
      batteryLevel: 100,
      resolution: "1080x1920",
      status: "online",
      activeApp: "com.browser.chrome",
      isSelectedForBroadcast: true,
    },
  ]);

  const toggleSelectDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, isSelectedForBroadcast: !d.isSelectedForBroadcast }
          : d,
      ),
    );
  };

  // Broadcast tap across all selected devices
  const handleBroadcastTap = () => {
    audioSynthesizer.playClickSound();
    const selected = devices.filter((d) => d.isSelectedForBroadcast);
    setStatusLog(
      `⚡ Broadcasted synchronized tap action across ${selected.length} Android devices.`,
    );
  };

  // Dispatch batch shell command
  const handleDispatchShell = () => {
    audioSynthesizer.playWaypointSound();
    setStatusLog(
      `🚀 Dispatched shell command '${shellCmd}' across all selected Android devices.`,
    );
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="agents"
        title="Android ADB Multi-Device Automation Grid & Action Broadcaster"
        badge={`${devices.filter((d) => d.isSelectedForBroadcast).length} / ${devices.length} Devices Synced`}
        settings={[
          {
            id: "broadcast",
            label: "Simultaneous Action Broadcast",
            type: "switch",
            value: isBroadcastMode,
            description: "Replicate 1 tap across all phones",
          },
          {
            id: "wifi_adb",
            label: "Wireless TCP/IP Auto-Discovery",
            type: "switch",
            value: true,
            description: "Port 5555 auto-connect",
          },
        ]}
        quickActions={[
          {
            label: "Broadcast Tap ⚡",
            action: handleBroadcastTap,
            variant: "default",
          },
          {
            label: "Refresh Devices 🔄",
            action: () => setStatusLog("Refreshed ADB device registry."),
            variant: "secondary",
          },
        ]}
      />

      {/* Multi-Device Management Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <CardTitle className="text-xs font-bold text-slate-100">
                Connected Android Devices & Emulator Grid
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400">
                Synchronized multi-device mirroring, gestures, and batch APK
                execution
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              placeholder="adb shell command..."
              className="h-7 text-xs bg-slate-900 border-slate-700 w-56 font-mono text-cyan-300"
            />
            <Button
              size="sm"
              onClick={handleDispatchShell}
              className="h-7 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
            >
              <Terminal className="w-3.5 h-3.5 mr-1" /> Exec Shell
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devices.map((d) => (
              <div
                key={d.id}
                onClick={() => toggleSelectDevice(d.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  d.isSelectedForBroadcast
                    ? "bg-slate-950 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-xl"
                    : "bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <strong className="text-slate-100 text-xs">
                      {d.model}
                    </strong>
                  </div>
                  <Badge className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border-emerald-800">
                    {d.connectionType.toUpperCase()}
                  </Badge>
                </div>

                {/* Simulated Screen Viewport */}
                <div className="relative w-full aspect-[9/16] max-h-48 rounded-lg overflow-hidden bg-black border border-slate-800 flex flex-col items-center justify-center text-slate-600 text-[10px]">
                  <span>Live ADB Mirror (60Hz)</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-1">
                    {d.resolution}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                  <span className="truncate">{d.serial}</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Battery className="w-3 h-3" /> {d.batteryLevel}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
        <strong>ADB Grid Telemetry:</strong> {statusLog}
      </div>
    </div>
  );
};
