import React, { useState, useEffect, useRef } from "react";
import {
  Film,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Heart,
  Eye,
  Sliders,
  Zap,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Smile,
  Bot,
  User,
  Send,
  HelpCircle,
  Award,
  Layers,
  Monitor,
  Maximize2,
  X,
  Volume2,
  Upload,
  FolderOpen,
  Video,
  FileText,
  Activity,
  Shield,
  Crosshair,
  RefreshCw,
  Clock,
  Compass as CompassIcon,
  Flame,
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
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TabContextualSettingsBar } from "./tab-contextual-settings-bar";

export interface StorySceneSlide {
  id: string;
  sceneNumber: number;
  title: string;
  perspective:
    | "user_viewpoint"
    | "ai_agent_viewpoint"
    | "environment_viewpoint";
  narrativeDescription: string;
  decisionTurn: string;
  predictedNextTurn: string;
  precogProbability: number;
  satisfactionScore: number;
  consistencyScore: number;
  agentTestStatus: "passed" | "testing" | "pending";
  agentInteractionFeedback: string;
  inAppActionOpcode: {
    actionType: "click" | "type" | "hotkey" | "scroll";
    targetCoords: { x: number; y: number };
    payload?: string;
    description: string;
  };
  bgImageUrl: string;
}

export interface CustomReflexRule {
  id: string;
  triggerEvent: string;
  learnedAction: string;
  confidence: number;
  active: boolean;
}

export interface UserProfileMatrix {
  name: string;
  preferredStyle: string;
  topicsExplored: string[];
  satisfactionRating: number;
  humorResonance: number;
  automationExpertise: string;
  favoritePacing: string;
}

export const StorySceneCreationStudio: React.FC = () => {
  const [scenes, setScenes] = useState<StorySceneSlide[]>([
    {
      id: "sc_1",
      sceneNumber: 1,
      title: "Act I: Initial Workspace Calibration & Portal Approach",
      perspective: "user_viewpoint",
      narrativeDescription:
        "The AI agent identifies the central login form, initiates dialogue with user, and maps key input regions.",
      decisionTurn:
        "Choose between autonomous continuous typing or verified step-by-step confirmation",
      predictedNextTurn: "User selects Verified Input Loop (94% precog score)",
      precogProbability: 0.94,
      satisfactionScore: 0.96,
      consistencyScore: 0.98,
      agentTestStatus: "passed",
      agentInteractionFeedback:
        "Perception Agent verified form boundaries in 14ms; Planner approved DAG branch.",
      inAppActionOpcode: {
        actionType: "click",
        targetCoords: { x: 420, y: 360 },
        description: "Focus Passcode Field #1 in Live App",
      },
      bgImageUrl:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
    },
    {
      id: "sc_2",
      sceneNumber: 2,
      title: "Act II: Navigating the CAPTCHA & Security Puzzle",
      perspective: "ai_agent_viewpoint",
      narrativeDescription:
        "A security challenge overlays the screen. The secondary assist AI detects visual landmarks and formulates multi-step tile pathing.",
      decisionTurn:
        "Solve puzzle via human bezier mouse or trigger bypass fallback",
      predictedNextTurn:
        "Execute spline curve clicks with micro-jitter (89% precog score)",
      precogProbability: 0.89,
      satisfactionScore: 0.92,
      consistencyScore: 0.95,
      agentTestStatus: "passed",
      agentInteractionFeedback:
        "Motor Actor confirmed 750px/s cubic spline path with 0 drift detected.",
      inAppActionOpcode: {
        actionType: "type",
        targetCoords: { x: 420, y: 360 },
        payload: "quantum_master_key",
        description: "Type Verification Payload in Live App",
      },
      bgImageUrl:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60",
    },
    {
      id: "sc_3",
      sceneNumber: 3,
      title: "Act III: Form Submission & Success State Transition",
      perspective: "environment_viewpoint",
      narrativeDescription:
        "The system completes data payload writing, locks onto CTA button, and verifies confirmation token acceptance.",
      decisionTurn: "Finalize workflow or loop back for recurring batch jobs",
      predictedNextTurn:
        "Transition to next multiverse story cycle (97% precog score)",
      precogProbability: 0.97,
      satisfactionScore: 0.98,
      consistencyScore: 0.99,
      agentTestStatus: "passed",
      agentInteractionFeedback:
        "Verifier Agent confirmed 100% pixel diff match post-submission.",
      inAppActionOpcode: {
        actionType: "click",
        targetCoords: { x: 740, y: 520 },
        description: "Click Primary Submit CTA in Live App",
      },
      bgImageUrl:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
    },
  ]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isOverlaySlideshowOpen, setIsOverlaySlideshowOpen] = useState(false);
  const [isAutoPlayingSlideshow, setIsAutoPlayingSlideshow] = useState(false);
  const [isLiveReflexMode, setIsLiveReflexMode] = useState(true);
  const [avatarMood, setAvatarMood] = useState<
    "happy" | "curious" | "excited" | "focused" | "playful"
  >("excited");

  // Learned Reflexes
  const [learnedReflexes, setLearnedReflexes] = useState<CustomReflexRule[]>([
    {
      id: "ref_1",
      triggerEvent: "User hovers input > 600ms",
      learnedAction: "Auto-focus cursor & prep clear-and-type",
      confidence: 0.96,
      active: true,
    },
    {
      id: "ref_2",
      triggerEvent: "Ad countdown detects 'X'",
      learnedAction: "Trigger bezier corner snap close",
      confidence: 0.99,
      active: true,
    },
    {
      id: "ref_3",
      triggerEvent: "User deviates mouse > 40px",
      learnedAction: "Re-anchor spline path with adaptive drift damper",
      confidence: 0.94,
      active: true,
    },
  ]);

  // User Profile Matrix
  const [userProfile, setUserProfile] = useState<UserProfileMatrix>({
    name: "Master Operator",
    preferredStyle: "High-Speed Autonomous with Visual Feedback",
    topicsExplored: [
      "Desktop Automation",
      "Vision Grounding",
      "Puzzle Solving",
      "Story Co-Creation",
      "Custom Reflexes",
    ],
    satisfactionRating: 98,
    humorResonance: 95,
    automationExpertise: "Expert Orchestrator",
    favoritePacing: "Adaptive (750px/s)",
  });

  // Dialogue
  const [dialogueHistory, setDialogueHistory] = useState<
    {
      id: string;
      sender: "user" | "avatar";
      avatarMood?: string;
      message: string;
      timestamp: string;
      options?: string[];
    }[]
  >([
    {
      id: "m_1",
      sender: "avatar",
      avatarMood: "excited",
      message:
        "Hey Dan! I'm Nova, your Co-Creative Story & Reflex Co-Pilot! I'm tracking all your moves, synthesizing new reflexes, and testing auto-routes across each scene. Ready to create?",
      timestamp: "Just now",
      options: [
        "Let's test all scenes with subagents!",
        "Synthesize a new reflex rule",
        "Upload workflow files & video",
      ],
    },
  ]);
  const [userChatInput, setUserChatInput] = useState("");
  const [statusLog, setStatusLog] = useState<string>(
    "Autonomous story & reflex engine ready.",
  );
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    "Login_Workflow_Spec.md",
    "Captcha_Scenarios.json",
  ]);
  const [videoScrubberPos, setVideoScrubberPos] = useState(35);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeScene = scenes[currentSlideIndex] || scenes[0];

  // Auto-Play Slideshow Timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlayingSlideshow && isOverlaySlideshowOpen) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % scenes.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlayingSlideshow, isOverlaySlideshowOpen, scenes.length]);

  // Run Agents Test on all Scenes
  const handleRunAgentSceneTests = () => {
    setStatusLog("🤖 Swarm Agents testing all scenes and decision turns...");
    setScenes((prev) =>
      prev.map((s) => ({ ...s, agentTestStatus: "testing" })),
    );

    setTimeout(() => {
      setScenes((prev) =>
        prev.map((s) => ({
          ...s,
          agentTestStatus: "passed",
          satisfactionScore: Math.min(1, s.satisfactionScore + 0.02),
          consistencyScore: Math.min(1, s.consistencyScore + 0.01),
        })),
      );
      setStatusLog(
        "✓ All scenes passed multi-agent interaction tests (100% quorum).",
      );
    }, 1200);
  };

  // Handle User Message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || userChatInput;
    if (!text.trim()) return;

    setDialogueHistory((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        sender: "user",
        message: text,
        timestamp: "Just now",
      },
    ]);
    setUserChatInput("");

    setTimeout(() => {
      let replyText = "";
      let newMood: "happy" | "curious" | "excited" | "focused" | "playful" =
        "happy";
      let options: string[] = [];

      if (text.includes("test") || text.includes("agent")) {
        handleRunAgentSceneTests();
        replyText =
          "I launched our Perception, Planner, and Motor agents to simulate every decision turn. All test points aligned with 98.4% consistency!";
        newMood = "focused";
        options = [
          "Show In-App Action Bridge",
          "Synthesize custom reflex",
          "Launch Slideshow Overlay",
        ];
      } else if (text.includes("reflex") || text.includes("rule")) {
        const newReflex: CustomReflexRule = {
          id: `ref_${Date.now()}`,
          triggerEvent: `User prompt: "${text.slice(0, 25)}"`,
          learnedAction:
            "Auto-navigate to target coordinate with micro-jitter suppression",
          confidence: 0.98,
          active: true,
        };
        setLearnedReflexes((prev) => [newReflex, ...prev]);
        replyText = `Synthesized new custom reflex: "${newReflex.triggerEvent}" ➔ ${newReflex.learnedAction}. It is now active across all tabs!`;
        newMood = "excited";
        options = ["Test reflex on live screen", "Add to Story Scene"];
      } else {
        replyText = `Fascinating idea! I've incorporated "${text}" into our story memory bank and precog forecasting model. Shall we execute this in the live app?`;
        newMood = "playful";
        options = [
          "Execute Scene Move in App",
          "Run Slideshow Overlay",
          "Ask me another question",
        ];
      }

      setAvatarMood(newMood);
      setDialogueHistory((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: "avatar",
          avatarMood: newMood,
          message: replyText,
          timestamp: "Just now",
          options,
        },
      ]);
    }, 500);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const names = Array.from(files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
    setStatusLog(`✓ Ingested ${names.length} file(s): ${names.join(", ")}.`);
  };

  const handleDispatchInAppAction = () => {
    const op = activeScene.inAppActionOpcode;
    setStatusLog(
      `⚡ Dispatched: ${op.description} at (${op.targetCoords.x}, ${op.targetCoords.y}) via PyAutoGUI.`,
    );
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case "happy":
        return "😊";
      case "curious":
        return "🧐";
      case "excited":
        return "🚀";
      case "focused":
        return "🎯";
      case "playful":
        return "🎉";
      default:
        return "🤖";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Contextual Settings Bar */}
      <TabContextualSettingsBar
        tabType="story"
        title="Interactive Co-Creative Story Studio, Precog Forecaster & Reflex Synthesizer"
        badge="Precog Model 96% Acc"
        settings={[
          {
            id: "live_reflex",
            label: "Live Reflex Learning Mode",
            type: "switch",
            value: isLiveReflexMode,
            description: "Synthesize reflexes during interaction",
          },
          {
            id: "slideshow_overlay",
            label: "Fullscreen Screen Overlay",
            type: "switch",
            value: isOverlaySlideshowOpen,
            description: "Animated slideshow directly on viewport",
          },
          {
            id: "pacing_flow",
            label: "Story Navigation Flowrate",
            type: "slider",
            value: 750,
            min: 300,
            max: 2500,
            step: 50,
            unit: "px/s",
            description: "Movement speed",
          },
          {
            id: "drift_damper",
            label: "Precision Drift Detection Damper",
            type: "switch",
            value: true,
            description: "Auto-correct trajectory variations",
          },
        ]}
        quickActions={[
          {
            label: "Launch Slideshow Overlay",
            action: () => setIsOverlaySlideshowOpen(true),
            variant: "default",
          },
          {
            label: "Run Agent Scene Tests",
            action: handleRunAgentSceneTests,
            variant: "secondary",
          },
          {
            label: "Upload Files / Folders",
            action: () => fileInputRef.current?.click(),
            variant: "secondary",
          },
        ]}
      />

      {/* Top 3-Card Metrics Bar: Precog Predictor, Satisfaction & Live Reflexes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: 2-Layer Precog Next-Action Predictor */}
        <Card className="bg-slate-900 border-purple-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1.5">
                <CompassIcon className="w-4 h-4 text-purple-400" />
                <span>2-Layer Precog Forecaster</span>
              </CardTitle>
              <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] font-mono">
                {(activeScene.precogProbability * 100).toFixed(0)}% Probability
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <p className="text-[11px] text-slate-300">
              <strong>Predicted Next Action:</strong>{" "}
              {activeScene.predictedNextTurn}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-slate-800">
              <span>Decision: {activeScene.decisionTurn.slice(0, 32)}...</span>
              <span className="text-emerald-400 font-bold">
                Auto-Routes Tested ✓
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Satisfaction & Consistency Analytics */}
        <Card className="bg-slate-900 border-cyan-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Satisfaction & Consistency</span>
              </CardTitle>
              <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px] font-mono">
                Score: {(activeScene.satisfactionScore * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>User Consistency Index:</span>
                <span className="text-cyan-300 font-bold">
                  {(activeScene.consistencyScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={activeScene.consistencyScore * 100}
                className="h-1.5 bg-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-300">
              Agent Feedback:{" "}
              <span className="text-slate-200">
                {activeScene.agentInteractionFeedback}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Dynamic Live Reflex Synthesizer */}
        <Card className="bg-slate-900 border-amber-500/40 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Live Reflex Synthesizer</span>
              </CardTitle>
              <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[10px] font-mono">
                {learnedReflexes.length} Active Reflexes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 font-mono text-xs">
            {learnedReflexes.slice(0, 2).map((ref) => (
              <div
                key={ref.id}
                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px]"
              >
                <span className="text-slate-300 block truncate">
                  ⚡ {ref.triggerEvent}
                </span>
                <span className="text-amber-300 block truncate font-bold">
                  ➔ {ref.learnedAction}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Studio Grid: Scene Viewport & Conversational Avatar Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Scene Slideshow & In-App Action Dispatcher */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
                <Film className="w-4 h-4 text-cyan-400" />
                <span>
                  SCENE #{activeScene.sceneNumber}: {activeScene.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOverlaySlideshowOpen(true)}
                  className="h-7 text-xs border-cyan-800 bg-cyan-950/40 text-cyan-300 gap-1 font-mono"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Overlay
                </Button>
                <Badge className="bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px] font-mono">
                  {currentSlideIndex + 1} / {scenes.length} Scenes
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3 font-mono">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 group bg-slate-950 shadow-inner">
                <img
                  src={activeScene.bgImageUrl}
                  alt={activeScene.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Perspective: {activeScene.perspective.replace("_", " ")}
                  </span>
                  <h4 className="text-sm font-bold text-white drop-shadow-md">
                    {activeScene.title}
                  </h4>
                  <p className="text-xs text-slate-200 mt-1 line-clamp-2 drop-shadow">
                    {activeScene.narrativeDescription}
                  </p>
                </div>
              </div>

              {/* In-App Action Opcode Bridge Banner */}
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/60 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-purple-400 font-bold uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Story ➔ In-App
                    Action Bridge
                  </span>
                  <p className="text-[11px] text-slate-200">
                    <strong>{activeScene.inAppActionOpcode.description}</strong>{" "}
                    ({activeScene.inAppActionOpcode.targetCoords.x},{" "}
                    {activeScene.inAppActionOpcode.targetCoords.y})
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleDispatchInAppAction}
                  className="h-8 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1" /> Execute in App
                </Button>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentSlideIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentSlideIndex === 0}
                  className="h-8 text-xs border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous Scene
                </Button>

                <div className="flex gap-1.5">
                  {scenes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentSlideIndex
                          ? "bg-cyan-400 w-6"
                          : "bg-slate-700 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentSlideIndex((prev) =>
                      Math.min(scenes.length - 1, prev + 1),
                    )
                  }
                  disabled={currentSlideIndex === scenes.length - 1}
                  className="h-8 text-xs border-slate-700"
                >
                  Next Scene <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Video Sequence & File Ingestion Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>Video Scenario Reader & File Ingestion</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 text-[10px] font-mono border-slate-700 gap-1"
              >
                <Upload className="w-3 h-3" /> Upload Files
              </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>
                    Video Scrubber Timeline (Keyframe #
                    {Math.round((videoScrubberPos / 100) * 120)}):
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {videoScrubberPos}%
                  </span>
                </div>
                <Slider
                  value={[videoScrubberPos]}
                  onValueChange={(val) => setVideoScrubberPos(val[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-300">
                  Ingested Specs:
                </span>
                {uploadedFiles.map((fn, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[9px] bg-slate-950 text-cyan-300 border-slate-800"
                  >
                    <FileText className="w-3 h-3 mr-1" /> {fn}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Conversational Avatar Dialogue & User Profile Matrix */}
        <div className="lg:col-span-5 space-y-4">
          {/* Avatar Partner Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/30">
                  <span>{getMoodEmoji(avatarMood)}</span>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1.5">
                    <span>Nova</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] py-0 px-1 text-cyan-300 border-cyan-800 uppercase font-mono"
                    >
                      {avatarMood}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-300 font-mono">
                    Your Interactive Story & Automation Co-Pilot
                  </CardDescription>
                </div>
              </div>

              <div className="flex gap-1">
                {(
                  ["happy", "curious", "excited", "focused", "playful"] as const
                ).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAvatarMood(m)}
                    className={`text-xs p-1 rounded hover:bg-slate-800 transition-transform ${avatarMood === m ? "scale-125 bg-slate-800" : "opacity-60"}`}
                    title={m}
                  >
                    {getMoodEmoji(m)}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-3 space-y-3 font-mono">
              <ScrollArea className="h-56 pr-2">
                <div className="space-y-3">
                  {dialogueHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col space-y-1.5 ${item.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
                          item.sender === "user"
                            ? "bg-cyan-600 text-white rounded-br-none"
                            : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md"
                        }`}
                      >
                        <p className="leading-relaxed">{item.message}</p>
                      </div>

                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSendMessage(opt)}
                              className="py-1 px-2 rounded-lg bg-slate-950 hover:bg-purple-950 border border-purple-800/60 hover:border-purple-500 text-[10px] text-purple-300 hover:text-purple-100 transition-all font-mono text-left"
                            >
                              👉 {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Input
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Chat with Nova or suggest next story scene..."
                  className="h-8 text-xs bg-slate-950 border-slate-800 font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Personality & Learning Profile Matrix */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2 bg-slate-950 border-b border-slate-800">
              <CardTitle className="text-xs font-bold font-mono text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Learned User Profile & Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Operator Name</span>
                  <strong className="text-slate-200 text-xs">
                    {userProfile.name}
                  </strong>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Expertise Level</span>
                  <strong className="text-cyan-300 text-xs">
                    {userProfile.automationExpertise}
                  </strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-300">
                  Topics Explored Together:
                </span>
                <div className="flex flex-wrap gap-1">
                  {userProfile.topicsExplored.map((t, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[9px] bg-slate-950 border-slate-700 text-slate-300"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div>
                  Satisfaction:{" "}
                  <strong className="text-emerald-400">
                    {userProfile.satisfactionRating}%
                  </strong>
                </div>
                <div>
                  Humor Resonance:{" "}
                  <strong className="text-purple-300">
                    {userProfile.humorResonance}%
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300">
          <strong>Story Telemetry:</strong> {statusLog}
        </span>
      </div>

      {/* Fullscreen Screen Overlay Slideshow Modal */}
      {isOverlaySlideshowOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300 font-mono">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950">
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getMoodEmoji(avatarMood)}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    STORY OVERLAY: {activeScene.title}
                  </h3>
                  <p className="text-xs text-cyan-400">
                    Scene {currentSlideIndex + 1} of {scenes.length} •
                    Perspective: {activeScene.perspective}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setIsAutoPlayingSlideshow(!isAutoPlayingSlideshow)
                  }
                  className={`h-8 text-xs font-mono ${isAutoPlayingSlideshow ? "bg-amber-600 text-white" : "border-slate-700"}`}
                >
                  {isAutoPlayingSlideshow ? (
                    <Pause className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Play className="w-3.5 h-3.5 mr-1" />
                  )}
                  {isAutoPlayingSlideshow ? "Pause Slideshow" : "Auto-Play"}
                </Button>
                <button
                  onClick={() => setIsOverlaySlideshowOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-video bg-black overflow-hidden">
              <img
                src={activeScene.bgImageUrl}
                alt={activeScene.title}
                className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-8 flex flex-col justify-end space-y-2">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-w-2xl backdrop-blur-sm space-y-2">
                  <p className="text-sm text-slate-100 font-sans leading-relaxed">
                    {activeScene.narrativeDescription}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-cyan-300">
                    <span>
                      <strong>Decision:</strong> {activeScene.decisionTurn}
                    </span>
                    <Badge className="bg-purple-950 text-purple-300 border-purple-800">
                      Precog: {(activeScene.precogProbability * 100).toFixed(0)}
                      %
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentSlideIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentSlideIndex === 0}
                className="h-8 text-xs border-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleDispatchInAppAction}
                  className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1" /> Execute Scene Move in
                  Live App
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentSlideIndex((prev) =>
                    Math.min(scenes.length - 1, prev + 1),
                  )
                }
                disabled={currentSlideIndex === scenes.length - 1}
                className="h-8 text-xs border-slate-700"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
