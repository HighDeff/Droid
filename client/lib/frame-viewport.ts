export interface FrameSize {
  width: number;
  height: number;
}

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FrameViewport extends ViewportRect {
  scale: number;
}

const positive = (value: number) => Math.max(0, value);

/**
 * Returns the displayed frame rectangle for an object-contain media element.
 * Coordinates inside this rectangle are in CSS pixels, independent of DPR.
 */
export function getContainedFrameViewport(
  viewport: ViewportRect,
  frame: FrameSize,
): FrameViewport {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    frame.width <= 0 ||
    frame.height <= 0
  ) {
    return { ...viewport, scale: 0 };
  }

  const scale = Math.min(
    viewport.width / frame.width,
    viewport.height / frame.height,
  );
  const width = frame.width * scale;
  const height = frame.height * scale;

  return {
    left: viewport.left + (viewport.width - width) / 2,
    top: viewport.top + (viewport.height - height) / 2,
    width,
    height,
    scale,
  };
}

export function framePointFromClient(
  clientX: number,
  clientY: number,
  viewport: FrameViewport,
  frame: FrameSize,
) {
  if (viewport.scale <= 0) return { x: 0, y: 0 };

  return {
    x: Math.round(
      Math.min(
        frame.width,
        Math.max(0, (clientX - viewport.left) / viewport.scale),
      ),
    ),
    y: Math.round(
      Math.min(
        frame.height,
        Math.max(0, (clientY - viewport.top) / viewport.scale),
      ),
    ),
  };
}

export function clientPointFromFrame(
  x: number,
  y: number,
  viewport: FrameViewport,
  frame: FrameSize,
) {
  return {
    x:
      viewport.left +
      (positive(Math.min(frame.width, x)) / frame.width) * viewport.width,
    y:
      viewport.top +
      (positive(Math.min(frame.height, y)) / frame.height) * viewport.height,
  };
}

export function framePointAsPercent(x: number, y: number, frame: FrameSize) {
  return {
    left: `${(positive(Math.min(frame.width, x)) / frame.width) * 100}%`,
    top: `${(positive(Math.min(frame.height, y)) / frame.height) * 100}%`,
  };
}
