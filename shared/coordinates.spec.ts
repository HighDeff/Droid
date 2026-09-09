import { describe, expect, it } from "vitest";
import { displayToFrame, frameToViewport } from "./coordinates";

describe("coordinate transforms", () => {
  it("maps a letterboxed display to the full source frame", () => {
    expect(
      displayToFrame(
        { x: 300, y: 200 },
        { x: 100, y: 50, width: 400, height: 300 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ x: 400, y: 300 });
  });

  it("maps frame pixels through scale and viewport offset", () => {
    expect(
      frameToViewport(
        { x: 400, y: 300 },
        {
          pixels: { width: 800, height: 600 },
          viewport: {
            pixels: { width: 1600, height: 1200 },
            css: { width: 800, height: 600 },
            devicePixelRatio: 2,
            offset: { x: 0, y: 0 },
          },
          scale: { x: 2, y: 2 },
          offset: { x: 0, y: 0 },
        },
      ),
    ).toEqual({ x: 800, y: 600 });
  });

  it("rejects points outside the displayed frame", () => {
    expect(() =>
      displayToFrame(
        { x: 99, y: 100 },
        { x: 100, y: 50, width: 400, height: 300 },
        { width: 800, height: 600 },
      ),
    ).toThrow("outside");
  });
});
