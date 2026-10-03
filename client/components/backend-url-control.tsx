import React, { useState } from "react";
import { Server, Check, X, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getRuntimeApiBase,
  setRuntimeApiBase,
  getEffectiveApiBase,
  apiUrl,
} from "@/lib/api";

/**
 * Backend connection control.
 *
 * On desktop web this is optional (same-origin works). On the installed APK
 * the WebView cannot reach the PC's localhost, so the user enters the
 * server address once here (e.g. http://192.168.1.50:3000) and every API
 * call in the app goes through it from then on.
 */
export const BackendUrlControl: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const [value, setValue] = useState(getRuntimeApiBase());
  const [status, setStatus] = useState<
    { ok: boolean; message: string } | undefined
  >(undefined);
  const [testing, setTesting] = useState(false);

  const effective = getEffectiveApiBase();

  const save = () => {
    const v = value.trim().replace(/\/+$/, "");
    if (v && !/^https?:\/\//i.test(v)) {
      setStatus({
        ok: false,
        message: "Use a full URL, e.g. http://192.168.1.50:3000",
      });
      return;
    }
    setRuntimeApiBase(v);
    setStatus(
      v
        ? { ok: true, message: `Backend set to ${v}` }
        : { ok: true, message: "Cleared — using same-origin / build default" },
    );
  };

  const test = async () => {
    setTesting(true);
    setStatus(undefined);
    try {
      const r = await fetch(apiUrl("/api/adb/devices"), {
        method: "GET",
      });
      const j = await r.json().catch(() => ({}));
      setStatus(
        r.ok
          ? {
              ok: true,
              message: `Connected ✓ (${(j.devices || []).length} ADB device(s) seen)`,
            }
          : { ok: false, message: `Server replied ${r.status}` },
      );
    } catch (e) {
      setStatus({
        ok: false,
        message: `Unreachable: ${String(e).slice(0, 90)}`,
      });
    }
    setTesting(false);
  };

  return (
    <div
      className={`flex ${compact ? "flex-row flex-wrap" : "flex-col"} items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-300">
        <Server className="w-3.5 h-3.5 text-cyan-400" />
        Backend
        <span className="max-w-[220px] truncate font-normal text-slate-500">
          {effective || "(same-origin)"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="http://192.168.1.50:3000"
          className="h-8 w-52 bg-slate-950 font-mono text-xs"
        />
        <Button size="sm" onClick={save} className="h-8 text-xs">
          <Check className="mr-1 h-3 w-3" /> Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={test}
          disabled={testing}
          className="h-8 text-xs"
        >
          <PlugZap className="mr-1 h-3 w-3" />
          {testing ? "…" : "Test"}
        </Button>
        {value && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue("");
              setRuntimeApiBase("");
              setStatus({
                ok: true,
                message: "Cleared — using same-origin / build default",
              });
            }}
            className="h-8 text-xs text-slate-400"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {status && (
        <div
          className={`text-[11px] font-mono ${status.ok ? "text-emerald-400" : "text-red-400"}`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};
