import React, { useState, useCallback } from "react";
import {
  getContainedFrameViewport,
  framePointFromClient,
  framePointAsPercent,
} from "./frame-viewport";

export interface FrameSize {
  width: number;
  height: number;
}

/**
 * Shared hook for canvas-style components that overlay coordinates on a
 * screenshot/video. Measures the media's real pixel size and maps pointer
 * events to frame pixels using proper letterbox math (object-contain).
 *
 * Usage:
 *   const { frame, onMediaLoad, toFrame, toPercent } = useFrameMapper();
 *   <div onMouseMove={(e) => { const p = toFrame(e); ... }}>
 *     <img src={...} onLoad={onMediaLoad} className="object-contain ..." />
 */
export function useFrameMapper(initial: FrameSize = { width: 1920, height: 1080 }) {
  const [frame, setFrame] = useState<FrameSize>(initial);

  const onMediaLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
      const el = e.currentTarget as HTMLImageElement & HTMLVideoElement;
      const w = el.naturalWidth || el.videoWidth || 0;
      const h = el.naturalHeight || el.videoHeight || 0;
      if (w > 0 && h > 0) {
        setFrame((prev) =>
          prev.width === w && prev.height === h ? prev : { width: w, height: h },
        );
      }
    },
    [],
  );

  const toFrame = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const viewport = getContainedFrameViewport(rect, frame);
      const pt = framePointFromClient(e.clientX, e.clientY, viewport, frame);
      return {
        ...pt,
        pctX: (pt.x / frame.width) * 100,
        pctY: (pt.y / frame.height) * 100,
      };
    },
    [frame],
  );

  const toPercent = useCallback(
    (x: number, y: number) => framePointAsPercent(x, y, frame),
    [frame],
  );

  return { frame, onMediaLoad, toFrame, toPercent };
}
