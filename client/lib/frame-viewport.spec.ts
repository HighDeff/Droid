import { describe, expect, it } from "vitest";
import {
  clientPointFromFrame,
  framePointAsPercent,
  framePointFromClient,
  getContainedFrameViewport,
} from "./frame-viewport";

describe("frame viewport mapping", () => {
  const frame = { width: 1920, height: 1080 };

  it("centers a wide frame without cropping", () => {
    const viewport = getContainedFrameViewport(
      { left: 10, top: 20, width: 800, height: 800 },
      frame,
    );

    expect(viewport).toEqual({
      left: 10,
      top: 195,
      width: 800,
      height: 450,
      scale: 800 / 1920,
    });
  });

  it("maps pointer coordinates through letterboxing", () => {
    const viewport = getContainedFrameViewport(
      { left: 0, top: 0, width: 800, height: 800 },
      frame,
    );

    expect(framePointFromClient(400, 400, viewport, frame)).toEqual({
      x: 960,
      y: 540,
    });
    expect(clientPointFromFrame(960, 540, viewport, frame)).toEqual({
      x: 400,
      y: 400,
    });
  });

  it("clamps clicks outside the displayed frame", () => {
    const viewport = getContainedFrameViewport(
      { left: 0, top: 0, width: 800, height: 800 },
      frame,
    );

    expect(framePointFromClient(-20, 20, viewport, frame)).toEqual({
      x: 0,
      y: 0,
    });
    expect(framePointAsPercent(1920, 1080, frame)).toEqual({
      left: "100%",
      top: "100%",
    });
  });
});
