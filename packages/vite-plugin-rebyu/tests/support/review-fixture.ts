import type { Review } from "../../src/schema";

export function reviewFixture(
  number: number,
  page = "/",
  status: Review["status"] = "open",
): Review {
  return {
    id: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
    number,
    page,
    status,
    message: number === 1 ? "A long comment that needs more room. ".repeat(25) : "A short note.",
    author: "Mira Chen",
    category: "feedback",
    screenshot:
      number === 2
        ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAIAAAAUMWhjAAAAJElEQVR4nGOYvOkKTRHDqAWjFoxaMGrBqAWjFoxaMGrB0LAAAPdLS1ufhrcSAAAAAElFTkSuQmCC"
        : undefined,
    createdAt: "2026-10-17T00:00:00.000Z",
    replies: [],
    context: { viewport: "1280x800", userAgent: "Browser test", errors: [] },
    anchor: {
      selector: "h1",
      xpath: "",
      text: "",
      tag: "h1",
      kind: "element",
      rect: { x: 0, y: 0, width: 100, height: 50 },
      offset: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      points: [],
    },
  };
}
