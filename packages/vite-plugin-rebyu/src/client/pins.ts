interface Size {
  width: number;
  height: number;
}
interface Box extends Size {
  x: number;
  y: number;
}
/** Keep the whole badge inside the viewport without changing the annotation geometry. */
export function pinPosition(anchor: Box, badge: Size, viewport: Size) {
  const margin = 6;
  const clamp = (value: number, size: number, limit: number) =>
    Math.max(margin, Math.min(value - size / 2, limit - size - margin));
  return {
    x: clamp(anchor.x, badge.width, viewport.width),
    y: clamp(anchor.y, badge.height, viewport.height),
    visible:
      anchor.x + anchor.width >= 0 &&
      anchor.y + anchor.height >= 0 &&
      anchor.x <= viewport.width &&
      anchor.y <= viewport.height,
  };
}
