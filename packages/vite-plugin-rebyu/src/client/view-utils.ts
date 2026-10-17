import { m } from "#i18n/messages";
import type { Review } from "../schema";

const categoryVariants = {
  feedback: "info-light",
  bug: "destructive-light",
  idea: "success-light",
} as const;

export const categoryBadgeVariant = (category: Review["category"]) => categoryVariants[category];

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

const categoryMessages = {
  feedback: m.review_kind_feedback,
  bug: m.review_kind_bug,
  idea: m.review_kind_idea,
};

export const categoryLabel = (category: Review["category"]) => categoryMessages[category]();
