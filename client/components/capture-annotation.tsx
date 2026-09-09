import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Crosshair,
  Eye,
  Flag,
  MessageSquare,
  MousePointer2,
  Pencil,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AnnotationStatus = "pending" | "verified" | "accomplished";
export type AnnotationKind = "marker" | "rectangle" | "freehand" | "note";

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  kind: AnnotationKind;
  label: string;
  note?: string;
  status: AnnotationStatus;
  color?: string;
  point?: AnnotationPoint;
  rect?: { x: number; y: number; width: number; height: number };
  points?: AnnotationPoint[];
}

export interface CaptureFrame {
  id: string;
  capturedAt: string;
  title: string;
  imageUrl: string;
  source: "desktop" | "android" | "upload";
  status: AnnotationStatus;
  accomplishment?: string;
  verification?: string;
  annotations: Annotation[];
}

interface CaptureGalleryProps {
  frames: CaptureFrame[];
  selectedFrameId: string;
  onSelectFrame: (frame: CaptureFrame) => void;
  className?: string;
}

export function CaptureGallery({
  frames,
  selectedFrameId,
  onSelectFrame,
  className,
}: CaptureGalleryProps) {
  return (
    <div className={cn("space-y-2", className)} aria-label="Capture timeline">
      {frames.map((frame, index) => (
        <button
          key={frame.id}
          type="button"
          onClick={() => onSelectFrame(frame)}
          aria-current={frame.id === selectedFrameId ? "true" : undefined}
          className={cn(
            "group flex w-full gap-3 rounded-lg border p-2 text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            frame.id === selectedFrameId
              ? "border-cyan-400/70 bg-cyan-400/10"
              : "border-slate-800 bg-slate-950/40 hover:border-slate-700",
          )}
        >
          <div className="relative flex w-20 shrink-0 items-center">
            <img
              src={frame.imageUrl}
              alt=""
              className="aspect-video w-20 rounded border border-slate-700 object-contain bg-slate-950"
            />
            <span className="absolute -left-3 flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[10px] text-slate-300">
              {index + 1}
            </span>
          </div>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="flex items-start justify-between gap-2">
              <span className="truncate text-xs font-semibold text-slate-100">
                {frame.title}
              </span>
              <StatusBadge status={frame.status} />
            </span>
            <span className="flex items-center gap-2 text-[10px] text-slate-400">
              <Clock3 className="h-3 w-3" />
              {frame.capturedAt}
              <span className="text-slate-600">•</span>
              {frame.source}
            </span>
            <span className="text-[10px] text-slate-500">
              {frame.annotations.length} annotation
              {frame.annotations.length === 1 ? "" : "s"}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

interface AnnotationCanvasProps {
  frame: CaptureFrame;
  selectedAnnotationId?: string;
  onSelectAnnotation?: (annotation: Annotation) => void;
  className?: string;
}

export function AnnotationCanvas({
  frame,
  selectedAnnotationId,
  onSelectAnnotation,
  className,
}: AnnotationCanvasProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950",
        className,
      )}
    >
      <img
        src={frame.imageUrl}
        alt={`Captured screen: ${frame.title}`}
        className="block aspect-video w-full object-contain bg-slate-950"
      />
      <div
        className="absolute inset-0"
        role="group"
        aria-label="Image annotations"
      >
        {frame.annotations.map((annotation) => (
          <AnnotationShape
            key={annotation.id}
            annotation={annotation}
            selected={annotation.id === selectedAnnotationId}
            onSelect={() => onSelectAnnotation?.(annotation)}
          />
        ))}
      </div>
    </div>
  );
}

function AnnotationShape({
  annotation,
  selected,
  onSelect,
}: {
  annotation: Annotation;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = annotation.color ?? "#22d3ee";
  const common = {
    borderColor: color,
    color,
    boxShadow: selected ? `0 0 0 2px ${color}66` : undefined,
  };

  if (annotation.kind === "marker" && annotation.point) {
    return (
      <button
        type="button"
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          left: `${annotation.point.x}%`,
          top: `${annotation.point.y}%`,
        }}
        onClick={onSelect}
        aria-label={`Annotation: ${annotation.label}`}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 bg-slate-950/80"
          style={common}
        >
          <Crosshair className="h-3 w-3" />
        </span>
      </button>
    );
  }

  if (annotation.kind === "rectangle" && annotation.rect) {
    return (
      <button
        type="button"
        className="absolute border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          ...common,
          left: `${annotation.rect.x}%`,
          top: `${annotation.rect.y}%`,
          width: `${annotation.rect.width}%`,
          height: `${annotation.rect.height}%`,
        }}
        onClick={onSelect}
        aria-label={`Annotation: ${annotation.label}`}
      >
        <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-medium">
          {annotation.label}
        </span>
      </button>
    );
  }

  if (annotation.kind === "freehand" && annotation.points?.length) {
    const points = annotation.points.map(({ x, y }) => `${x},${y}`).join(" ");
    return (
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label={`Annotation: ${annotation.label}`}
        role="img"
        onClick={onSelect}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
          className={cn(selected && "drop-shadow-[0_0_3px_currentColor]")}
        />
      </svg>
    );
  }

  return (
    <button
      type="button"
      className="absolute max-w-48 rounded border bg-slate-950/90 px-2 py-1 text-left text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        ...common,
        left: `${annotation.point?.x ?? 8}%`,
        top: `${annotation.point?.y ?? 8}%`,
      }}
      onClick={onSelect}
      aria-label={`Annotation: ${annotation.label}`}
    >
      <span className="flex items-center gap-1 font-semibold">
        <MessageSquare className="h-3 w-3" />
        {annotation.label}
      </span>
      {annotation.note && (
        <span className="text-slate-300">{annotation.note}</span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: AnnotationStatus }) {
  const labels = {
    pending: "Pending",
    verified: "Verified",
    accomplished: "Done",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 px-1.5 py-0 text-[9px]",
        status === "verified" && "border-emerald-500/50 text-emerald-300",
        status === "accomplished" && "border-cyan-500/50 text-cyan-300",
        status === "pending" && "border-amber-500/50 text-amber-300",
      )}
    >
      {labels[status]}
    </Badge>
  );
}

interface CaptureAnnotationWorkspaceProps {
  frames: CaptureFrame[];
  initialFrameId?: string;
  onFrameChange?: (frame: CaptureFrame) => void;
  onAnnotationSelect?: (annotation: Annotation, frame: CaptureFrame) => void;
  className?: string;
}

export function CaptureAnnotationWorkspace({
  frames,
  initialFrameId,
  onFrameChange,
  onAnnotationSelect,
  className,
}: CaptureAnnotationWorkspaceProps) {
  const firstFrame = frames[0];
  const [selectedFrameId, setSelectedFrameId] = useState(
    initialFrameId ?? firstFrame?.id ?? "",
  );
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string>();
  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === selectedFrameId) ?? firstFrame,
    [frames, firstFrame, selectedFrameId],
  );

  if (!selectedFrame) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No captures available yet.
        </CardContent>
      </Card>
    );
  }

  const selectFrame = (frame: CaptureFrame) => {
    setSelectedFrameId(frame.id);
    setSelectedAnnotationId(undefined);
    onFrameChange?.(frame);
  };

  const selectAnnotation = (annotation: Annotation) => {
    setSelectedAnnotationId(annotation.id);
    onAnnotationSelect?.(annotation, selectedFrame);
  };

  const selectedAnnotation = selectedFrame.annotations.find(
    (annotation) => annotation.id === selectedAnnotationId,
  );

  return (
    <div
      className={cn(
        "grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_240px]",
        className,
      )}
    >
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Capture timeline</CardTitle>
          <CardDescription className="text-xs">
            Select a moment to inspect its evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-5 pr-3">
          <CaptureGallery
            frames={frames}
            selectedFrameId={selectedFrame.id}
            onSelectFrame={selectFrame}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-sm">{selectedFrame.title}</CardTitle>
            <CardDescription className="mt-1 text-xs">
              {selectedFrame.capturedAt} • {selectedFrame.source} capture
            </CardDescription>
          </div>
          <StatusBadge status={selectedFrame.status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <AnnotationCanvas
            frame={selectedFrame}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={selectAnnotation}
          />
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Square className="h-3 w-3 text-cyan-300" /> rectangle
            </span>
            <span className="inline-flex items-center gap-1">
              <MousePointer2 className="h-3 w-3 text-amber-300" /> marker
            </span>
            <span className="inline-flex items-center gap-1">
              <Pencil className="h-3 w-3 text-fuchsia-300" /> freehand
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Evidence details</CardTitle>
          <CardDescription className="text-xs">
            Metadata for verification and accomplishment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <MetadataRow
            icon={Eye}
            label="Verification"
            value={selectedFrame.verification}
          />
          <MetadataRow
            icon={Flag}
            label="Accomplishment"
            value={selectedFrame.accomplishment}
          />
          {selectedAnnotation && (
            <div className="border-t border-slate-800 pt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                Selected annotation
              </p>
              <p className="font-medium text-slate-100">
                {selectedAnnotation.label}
              </p>
              {selectedAnnotation.note && (
                <p className="mt-1 text-slate-400">{selectedAnnotation.note}</p>
              )}
              <div className="mt-2">
                <StatusBadge status={selectedAnnotation.status} />
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => selectAnnotation(selectedFrame.annotations[0])}
            disabled={selectedFrame.annotations.length === 0}
          >
            <CircleDot className="h-3.5 w-3.5" />
            Focus first annotation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-slate-300">{value ?? "Not recorded"}</p>
      </div>
    </div>
  );
}

export const mockCaptureFrames: CaptureFrame[] = [
  {
    id: "capture-login",
    capturedAt: "09:41:12.240",
    title: "Login form ready",
    imageUrl:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
    source: "desktop",
    status: "verified",
    verification:
      "Username and password fields visible; contrast check passed.",
    accomplishment: "Ready for credential entry.",
    annotations: [
      {
        id: "login-target",
        kind: "rectangle",
        label: "Credential form",
        status: "verified",
        rect: { x: 28, y: 25, width: 44, height: 45 },
      },
      {
        id: "login-note",
        kind: "note",
        label: "Focus order",
        note: "Username receives focus first.",
        status: "accomplished",
        point: { x: 8, y: 12 },
        color: "#fbbf24",
      },
    ],
  },
  {
    id: "capture-submit",
    capturedAt: "09:41:15.890",
    title: "Submit action observed",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    source: "upload",
    status: "accomplished",
    verification: "Primary action is present in the expected region.",
    accomplishment: "Submit target documented for future action planning.",
    annotations: [
      {
        id: "submit-marker",
        kind: "marker",
        label: "Submit target",
        status: "accomplished",
        point: { x: 67, y: 63 },
        color: "#22d3ee",
      },
      {
        id: "submit-freehand",
        kind: "freehand",
        label: "Action region",
        status: "verified",
        points: [
          { x: 53, y: 52 },
          { x: 59, y: 48 },
          { x: 70, y: 50 },
          { x: 76, y: 61 },
          { x: 69, y: 71 },
          { x: 56, y: 69 },
          { x: 53, y: 52 },
        ],
        color: "#e879f9",
      },
    ],
  },
];
