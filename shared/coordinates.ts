export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface Viewport {
  pixels: Size;
  css: Size;
  devicePixelRatio: number;
  offset: Point;
}

export interface FrameMetadata {
  pixels: Size;
  viewport: Viewport;
  scale: Point;
  offset: Point;
}

const finitePositive = (value: number) => Number.isFinite(value) && value > 0;

export function validateSize(size: Size, name = "size"): void {
  if (
    !finitePositive(size.width) ||
    !finitePositive(size.height) ||
    !Number.isInteger(size.width) ||
    !Number.isInteger(size.height)
  ) {
    throw new Error(`${name} must contain positive integer dimensions`);
  }
}

export function validatePoint(point: Point, size: Size, name = "point"): void {
  validateSize(size);
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.y < 0 ||
    point.x >= size.width ||
    point.y >= size.height
  ) {
    throw new Error(
      `${name} is outside the ${size.width}x${size.height} bounds`,
    );
  }
}

/**
 * Maps a point in a displayed (possibly letterboxed) frame to source pixels.
 * The displayed rectangle must describe the actual image box, not its parent.
 */
export function displayToFrame(
  point: Point,
  displayed: Rect,
  frame: Size,
): Point {
  validateSize(frame, "frame");
  if (
    !Number.isFinite(displayed.width) ||
    !Number.isFinite(displayed.height) ||
    displayed.width <= 0 ||
    displayed.height <= 0
  ) {
    throw new Error("displayed rectangle must have positive dimensions");
  }
  if (
    point.x < displayed.x ||
    point.y < displayed.y ||
    point.x >= displayed.x + displayed.width ||
    point.y >= displayed.y + displayed.height
  ) {
    throw new Error("display point is outside the displayed frame");
  }
  const mapped = {
    x: Math.floor(((point.x - displayed.x) / displayed.width) * frame.width),
    y: Math.floor(((point.y - displayed.y) / displayed.height) * frame.height),
  };
  return {
    x: Math.min(frame.width - 1, Math.max(0, mapped.x)),
    y: Math.min(frame.height - 1, Math.max(0, mapped.y)),
  };
}

export function frameToViewport(point: Point, metadata: FrameMetadata): Point {
  validatePoint(point, metadata.pixels, "frame point");
  const x = point.x * metadata.scale.x + metadata.offset.x;
  const y = point.y * metadata.scale.y + metadata.offset.y;
  validatePoint({ x, y }, metadata.viewport.pixels, "viewport point");
  return { x: Math.round(x), y: Math.round(y) };
}
