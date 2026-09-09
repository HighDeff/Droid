import React, { useState, useEffect } from "react";
import {
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CornerDownLeft,
  Delete,
  Search,
  Crosshair,
  ShieldCheck,
  Zap,
  Sliders,
  Send,
  Eye,
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
import { Switch } from "@/components/ui/switch";

interface VirtualKeyboardProps {
  onKeyPress?: (key: string) => void;
  onExecuteTypeAndVerify?: (
    targetX: number,
    targetY: number,
    text: string,
  ) => void;
  onLocateSubmitButton?: (region: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export const VirtualKeyboardInputVerifier: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onExecuteTypeAndVerify,
  onLocateSubmitButton,
}) => {
  const [inputText, setInputText] = useState("admin@secure-portal.io");
  const [typedBuffer, setTypedBuffer] = useState("");
  const [isTypingLoopActive, setIsTypingLoopActive] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "matched" | "mismatch_corrected"
  >("idle");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Proximity Radar State
  const [isNearInputBox, setIsNearInputBox] = useState(true);
  const [detectedInputBox, setDetectedInputBox] = useState({
    x: 600,
    y: 450,
    width: 320,
    height: 48,
    label: "Username / Email Input Field",
  });

  const [locatedSubmitButton, setLocatedSubmitButton] = useState({
    x: 960,
    y: 742,
    width: 160,
    height: 44,
    label: "Submit / Continue CTA",
    confidence: 0.97,
  });

  const keyRows = [
    [
      "`",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "-",
      "=",
      "Backspace",
    ],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Esc"],
    ["Ctrl", "Alt", "Space", "Alt", "Ctrl"],
  ];

  // Character-by-character validation loop simulation
  const handleStartTypingLoop = () => {
    if (!inputText) return;
    setIsTypingLoopActive(true);
    setTypedBuffer("");
    setCurrentCharIndex(0);
    setVerificationStatus("verifying");
  };

  useEffect(() => {
    if (!isTypingLoopActive) return;

    if (currentCharIndex < inputText.length) {
      const char = inputText[currentCharIndex];
      setActiveKey(char.toLowerCase());

      const timer = setTimeout(() => {
        setTypedBuffer((prev) => prev + char);
        setCurrentCharIndex((prev) => prev + 1);
        setVerificationStatus("verifying");
      }, 120);

      return () => clearTimeout(timer);
    } else {
      setIsTypingLoopActive(false);
      setActiveKey(null);
      setVerificationStatus("matched");
      onLocateSubmitButton?.({
        x: locatedSubmitButton.x,
        y: locatedSubmitButton.y,
        width: locatedSubmitButton.width,
        height: locatedSubmitButton.height,
      });
    }
  }, [isTypingLoopActive, currentCharIndex, inputText]);

  const handleVirtualKeyPress = (key: string) => {
    setActiveKey(key);
    onKeyPress?.(key);
    setTimeout(() => setActiveKey(null), 150);

    if (key === "Backspace") {
      setTypedBuffer((prev) => prev.slice(0, -1));
    } else if (key === "Space") {
      setTypedBuffer((prev) => prev + " ");
    } else if (key.length === 1) {
      setTypedBuffer((prev) => prev + key);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Input Proximity & Verification HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Input Box Proximity Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">
                Input Box Proximity
              </span>
              <Badge
                className={`text-[10px] ${isNearInputBox ? "bg-cyan-950 text-cyan-300 border-cyan-800" : "bg-slate-800 text-slate-300"}`}
              >
                {isNearInputBox ? "Target Locked (<30px)" : "Out of Range"}
              </Badge>
            </div>
            <div className="text-xs font-mono text-slate-200">
              <p className="font-bold">{detectedInputBox.label}</p>
              <p className="text-[10px] text-slate-300">
                Pos: ({detectedInputBox.x}, {detectedInputBox.y}) [
                {detectedInputBox.width}x{detectedInputBox.height}px]
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Character OCR Verification State */}
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">
                Char-by-Char OCR Check
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 capitalize">
                {verificationStatus}
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-cyan-300 truncate">
              {typedBuffer || (
                <span className="text-slate-400">
                  Waiting for typing loop...
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post-Typing CTA Button Locator */}
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">
                Post-Input CTA Locator
              </span>
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                {(locatedSubmitButton.confidence * 100).toFixed(0)}% Conf
              </Badge>
            </div>
            <div className="text-xs font-mono text-slate-200">
              <p className="font-bold">{locatedSubmitButton.label}</p>
              <p className="text-[10px] text-slate-300">
                Pos: ({locatedSubmitButton.x}, {locatedSubmitButton.y})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Virtual Keyboard & Controller */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl space-y-4">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                <span>
                  Interactive Virtual Keyboard & Character Verification Loop
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Simulates typing strokes, performs post-character OCR
                verification, and triggers CTA dispatch
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Target payload..."
                className="h-8 text-xs bg-slate-950 border-slate-700 w-64"
              />
              <Button
                size="sm"
                onClick={handleStartTypingLoop}
                disabled={isTypingLoopActive}
                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Start Verified Type Loop
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Virtual Keyboard Key Matrix */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 select-none">
            {keyRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1">
                {row.map((key) => {
                  const isCurrentActive =
                    activeKey === key.toLowerCase() || activeKey === key;
                  const isSpecial = [
                    "Backspace",
                    "Tab",
                    "Caps",
                    "Enter",
                    "Shift",
                    "Esc",
                    "Ctrl",
                    "Alt",
                    "Space",
                  ].includes(key);

                  return (
                    <button
                      key={key}
                      onClick={() => handleVirtualKeyPress(key)}
                      className={`h-9 rounded font-mono text-xs transition-all active:scale-95 flex items-center justify-center font-bold ${
                        key === "Space" ? "w-64" : isSpecial ? "px-3" : "w-9"
                      } ${
                        isCurrentActive
                          ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/50 scale-105 border-cyan-300"
                          : isSpecial
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
                      }`}
                    >
                      {key === "Backspace" ? (
                        <Delete className="w-3.5 h-3.5" />
                      ) : key === "Enter" ? (
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        key
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Action Dispatcher Footer */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Auto-Correction on Mismatch: Enabled (Backspace & Retry)
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onExecuteTypeAndVerify?.(
                  detectedInputBox.x,
                  detectedInputBox.y,
                  inputText,
                );
              }}
              className="h-7 text-xs border-slate-700 text-cyan-400 hover:text-cyan-300"
            >
              Dispatch PyAutoGUI Native Type
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
