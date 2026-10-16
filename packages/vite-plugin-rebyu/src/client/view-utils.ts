export const statusLabel = (value: string) =>
  ({
    open: "Open",
    "in-progress": "In progress",
    resolved: "Resolved",
    dismissed: "Dismissed",
  })[value] ?? value;
export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function boxStyle(box: { x: number; y: number; width: number; height: number }) {
  return {
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };
}
