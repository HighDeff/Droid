import React, { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Battery,
  Play,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Wifi,
  Unplug,
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
import { apiUrl } from "@/lib/api";

export interface AndroidDeviceInfo {
  serial: string;
  model: string;
  batteryLevel: number | null;
  resolution: string | null;
  connectionType: "usb" | "wifi";
  isSelectedForBroadcast: boolean;
  previewUrl: string | null;
}

async function postJson(path: string, body: any) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const AndroidAdbMultiDeviceGrid: React.FC = () => {
  const [devices, setDevices] = useState<AndroidDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [tapX, setTapX] = useState(540);
  const [tapY, setTapY] = useState(960);
  const [shellCmd, setShellCmd] = useState<string>("input tap 540 960");
  const [wifiIp, setWifiIp] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [statusLog, setStatusLog] = useState<string>(
    "ADB Multi-Device Grid ready. Press Refresh to list connected devices.",
  );

  const refreshDevices = useCallback(async () => {
    setLoading(true);
    setStatusLog("Querying `adb devices`...");
    try {
      const res = await fetch(apiUrl("/api/adb/devices"));
      const data = await res.json();
      if (!data.success) {
        setStatusLog(
          `ADB unavailable: ${data.error || "is adb installed and on PATH?"}`,
        );
        setDevices([]);
        return;
      }
      const serials: string[] = data.devices || [];
      if (serials.length === 0) {
        setStatusLog(
          "No devices found. Connect via USB (debugging on) or pair over Wi-Fi below.",
        );
        setDevices([]);
        return;
      }
      const infos = await Promise.all(
        serials.map(async (serial) => {
          try {
            const info = await postJson("/api/adb/device-info", {
              deviceId: serial,
            });
            return {
              serial,
              model: info.model || serial,
              batteryLevel: info.batteryLevel ?? null,
              resolution: info.resolution || null,
              connectionType:
                info.connectionType === "wifi" ? "wifi" : "usb",
              isSelectedForBroadcast: true,
              previewUrl: null,
            } as AndroidDeviceInfo;
          } catch {
            return {
              serial,
              model: serial,
              batteryLevel: null,
              resolution: null,
              connectionType: serial.includes(":") ? "wifi" : "usb",
              isSelectedForBroadcast: true,
              previewUrl: null,
            } as AndroidDeviceInfo;
          }
        }),
      );
      setDevices(infos);
      setStatusLog(`Found ${infos.length} device(s). Select targets, then broadcast.`);
    } catch (e) {
      setStatusLog(`Refresh failed: ${String(e).slice(0, 80)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const toggleSelectDevice = (serial: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.serial === serial
          ? { ...d, isSelectedForBroadcast: !d.isSelectedForBroadcast }
          : d,
      ),
    );
  };

  const capturePreview = async (serial: string) => {
    try {
      const res = await fetch(
        apiUrl(`/api/adb/capture?deviceId=${encodeURIComponent(serial)}`),
      );
      const data = await res.json();
      if (data.success && data.imageData) {
        setDevices((prev) =>
          prev.map((d) =>
            d.serial === serial ? { ...d, previewUrl: data.imageData } : d,
          ),
        );
      } else {
        setStatusLog(`Capture failed for ${serial}: ${data.error || "unknown"}`);
      }
    } catch (e) {
      setStatusLog(`Capture error: ${String(e).slice(0, 60)}`);
    }
  };

  const selected = devices.filter((d) => d.isSelectedForBroadcast);

  // Broadcast a tap at (x, y) to every selected device via the real
  // execute-task -> ADB path.
  const handleBroadcastTap = async (x: number, y: number) => {
    if (selected.length === 0) {
      setStatusLog("No devices selected for broadcast.");
      return;
    }
    setStatusLog(
      `Broadcasting tap (${x}, ${y}) to ${selected.length} device(s)...`,
    );
    const results = await Promise.all(
      selected.map(async (d) => {
        try {
          const data = await postJson("/api/execute-task", {
            targetDevice: "android",
            deviceId: d.serial,
            task: {
              id: `adb_broadcast_${Date.now()}_${d.serial}`,
              name: `Broadcast tap (${x},${y})`,
              action: "click",
              targetPosition: { x, y },
            },
          });
          return data.success;
        } catch {
          return false;
        }
      }),
    );
    const ok = results.filter(Boolean).length;
    setStatusLog(
      ok === selected.length
        ? `✓ Broadcasted tap (${x}, ${y}) to ${ok} device(s).`
        : `⚠ Tap reached ${ok}/${selected.length} device(s).`,
    );
  };

  // The shell box only accepts the safe `input tap X Y` form and routes it
  // through the same broadcast path (no arbitrary adb shell from the UI).
  const handleDispatchShell = () => {
    const m = shellCmd.trim().match(/^input\s+tap\s+(\d+)\s+(\d+)$/i);
    if (!m) {
      setStatusLog(
        `Only "input tap X Y" is supported here (got: ${shellCmd.slice(0, 40)}).`,
      );
      return;
    }
    handleBroadcastTap(parseInt(m[1], 10), parseInt(m[2], 10));
  };

  const handleConnectWifi = async () => {
    if (!wifiIp.trim()) {
      setStatusLog("Enter the phone's Wi-Fi IP first.");
      return;
    }
    setStatusLog(`Connecting to ${wifiIp.trim()}:5555 ...`);
    const data = await postJson("/api/adb/connect", {
      ip: wifiIp.trim(),
      port: 5555,
    });
    setStatusLog(
      data.success
        ? `✓ ${data.output || "Connected."}`
        : `✗ Connect failed: ${data.error || data.output || "unknown"}`,
    );
    if (data.success) refreshDevices();
  };

  const handlePair = async () => {
    if (!wifiIp.trim() || !pairCode.trim()) {
      setStatusLog("Enter the pairing IP:port and the 6-digit code.");
      return;
    }
    const [ip, portStr] = wifiIp.split(":");
    setStatusLog(`Pairing with ${wifiIp.trim()} ...`);
    const data = await postJson("/api/adb/pair", {
      ip: (ip || "").trim(),
      port: portStr ? parseInt(portStr, 10) : 5555,
      code: pairCode.trim(),
    });
    setStatusLog(
      data.success
        ? `✓ ${data.output || "Paired."} Now press Connect.`
        : `✗ Pair failed: ${data.error || data.output || "unknown"}`,
    );
  };

  const handleDisconnect = async (serial: string) => {
    const data = await postJson("/api/adb/disconnect", { deviceId: serial });
    setStatusLog(data.success ? `Disconnected ${serial}.` : `Disconnect failed.`);
    refreshDevices();
  };

  return (
    <div className="space-y-4 font-mono">
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <CardTitle className="text-xs font-bold text-slate-100">
                Connected Android Devices (live via ADB)
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400">
                {selected.length} / {devices.length} selected for broadcast
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tapX}
                onChange={(e) => setTapX(parseInt(e.target.value) || 0)}
                className="h-7 w-20 text-xs bg-slate-900 border-slate-700"
                title="Tap X"
              />
              <Input
                type="number"
                value={tapY}
                onChange={(e) => setTapY(parseInt(e.target.value) || 0)}
                className="h-7 w-20 text-xs bg-slate-900 border-slate-700"
                title="Tap Y"
              />
              <Button
                size="sm"
                onClick={() => handleBroadcastTap(tapX, tapY)}
                disabled={selected.length === 0}
                className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Broadcast Tap
              </Button>
            </div>
            <Input
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              placeholder="input tap 540 960"
              title='Only "input tap X Y" is supported'
              className="h-7 text-xs bg-slate-900 border-slate-700 w-48 font-mono text-cyan-300"
            />
            <Button
              size="sm"
              onClick={handleDispatchShell}
              className="h-7 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white"
            >
              <Terminal className="w-3.5 h-3.5 mr-1" /> Run
            </Button>
            <Button
              size="sm"
              onClick={refreshDevices}
              disabled={loading}
              variant="outline"
              className="h-7 text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {devices.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs space-y-2">
              <Smartphone className="w-10 h-10 mx-auto text-slate-600" />
              <p>
                No ADB devices detected. Enable USB debugging (or Wireless
                debugging) on the phone, then Refresh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {devices.map((d) => (
                <div
                  key={d.serial}
                  onClick={() => toggleSelectDevice(d.serial)}
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

                  <div
                    className="relative w-full aspect-[9/16] max-h-48 rounded-lg overflow-hidden bg-black border border-slate-800 flex flex-col items-center justify-center text-slate-600 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      capturePreview(d.serial);
                    }}
                    title="Click to capture a live preview"
                  >
                    {d.previewUrl ? (
                      <img
                        src={d.previewUrl}
                        alt={`${d.model} screen`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <span>Click for live preview</span>
                        <span className="text-[9px] text-cyan-400 font-mono mt-1">
                          {d.resolution || "unknown resolution"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="truncate" title={d.serial}>
                      {d.serial}
                    </span>
                    <span className="flex items-center gap-2">
                      {d.batteryLevel !== null && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Battery className="w-3 h-3" /> {d.batteryLevel}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(d.serial);
                        }}
                        title="Disconnect device"
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Unplug className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wi-Fi pairing / connect */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-3 border-b border-slate-800">
          <CardTitle className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" /> Wireless ADB (Android 11+)
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-400">
            Phone: Settings → Developer options → Wireless debugging → Pair with
            pairing code
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <Input
            value={wifiIp}
            onChange={(e) => setWifiIp(e.target.value)}
            placeholder="192.168.1.50 or 192.168.1.50:37821"
            className="h-7 text-xs bg-slate-950 border-slate-700 w-56"
          />
          <Input
            value={pairCode}
            onChange={(e) => setPairCode(e.target.value)}
            placeholder="Pairing code"
            className="h-7 text-xs bg-slate-950 border-slate-700 w-32"
          />
          <Button
            size="sm"
            onClick={handlePair}
            className="h-7 text-xs bg-cyan-700 hover:bg-cyan-600 text-white"
          >
            Pair
          </Button>
          <Button
            size="sm"
            onClick={handleConnectWifi}
            className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 text-white"
          >
            Connect
          </Button>
        </CardContent>
      </Card>

      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>ADB Grid:</strong> {statusLog}
        </span>
      </div>
    </div>
  );
};
