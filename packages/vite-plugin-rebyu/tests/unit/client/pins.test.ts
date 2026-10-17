import { describe, expect, it } from "vitest";
import { pinPosition } from "../../../src/client/pins";

const viewport = { width: 390, height: 844 };
const badge = { width: 27, height: 27 };
describe("Given review pins at viewport edges", () => {
  it.each([
    [0, 102],
    [0, 0],
    [390, 0],
    [390, 844],
    [0, 844],
    [-10, -10],
  ])("Then the full badge stays visible at (%s, %s)", (x, y) => {
    const position = pinPosition({ x, y, width: 100, height: 100 }, badge, viewport);
    expect(position.visible).toBe(true);
    expect(position.x).toBeGreaterThanOrEqual(6);
    expect(position.y).toBeGreaterThanOrEqual(6);
    expect(position.x + badge.width).toBeLessThanOrEqual(viewport.width - 6);
    expect(position.y + badge.height).toBeLessThanOrEqual(viewport.height - 6);
  });
  it("Then wider badges use their actual width", () => {
    expect(
      pinPosition({ x: 390, y: 100, width: 0, height: 0 }, { width: 54, height: 27 }, viewport).x,
    ).toBe(330);
  });
  it("Then interior badges stay centered on their annotation", () => {
    expect(pinPosition({ x: 100, y: 200, width: 80, height: 50 }, badge, viewport)).toEqual({
      x: 86.5,
      y: 186.5,
      visible: true,
    });
  });
  it("Then annotations outside the viewport do not leave stray badges at its edges", () => {
    expect(pinPosition({ x: 20, y: -300, width: 100, height: 100 }, badge, viewport).visible).toBe(
      false,
    );
    expect(pinPosition({ x: 20, y: 900, width: 100, height: 100 }, badge, viewport).visible).toBe(
      false,
    );
  });
});
