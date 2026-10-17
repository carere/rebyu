import type { RebyuUser } from "../client-api";
import type { Review } from "../schema";
export interface Reviewer {
  id?: string;
  name: string;
}
type Author = { author: string; authorId?: string };
export function isReviewer(author: Author, reviewer: Reviewer): boolean {
  if (author.authorId) return !!reviewer.id && author.authorId === reviewer.id;
  return (
    !!reviewer.name.trim() &&
    author.author.trim().toLowerCase() === reviewer.name.trim().toLowerCase()
  );
}
/** Only unresolved conversations notify; count other people's replies after participation. */
export function unreadReplies(
  review: Pick<Review, "author" | "authorId" | "replies" | "status">,
  reviewer: Reviewer,
  read: ReadonlySet<string>,
) {
  if (review.status !== "open" && review.status !== "in-progress") return [];
  if (!reviewer.id && !reviewer.name.trim()) return [];
  const first = isReviewer(review, reviewer)
    ? -1
    : review.replies.findIndex((reply) => isReviewer(reply, reviewer));
  if (first === -1 && !isReviewer(review, reviewer)) return [];
  return review.replies.filter(
    (reply, index) => index > first && !isReviewer(reply, reviewer) && !read.has(reply.id),
  );
}
export function reviewerKey(reviewer: Reviewer) {
  return reviewer.id ? `id:${reviewer.id}` : `name:${reviewer.name.trim().toLowerCase()}`;
}
export function reviewerIdentity(user: RebyuUser | null, name: string): Reviewer {
  return { id: user?.id, name };
}
