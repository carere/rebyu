import { z } from "zod";
import { type ReviewScope, reviewScopeSchema } from "../reviews/review-repository";

const reviewPermissions = ["read", "create", "reply", "triage", "delete"] as const;
export type ReviewPermission = (typeof reviewPermissions)[number];
export interface ReviewSession {
  scope: ReviewScope;
  reviewer: { id: string; name: string };
  permissions: readonly ReviewPermission[];
}
export type ReviewAuthenticator = (request: Request) => Promise<ReviewSession | null>;

const sessionSchema = z.object({
  scope: reviewScopeSchema,
  reviewer: z.object({
    id: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(80),
  }),
  permissions: z.array(z.enum(reviewPermissions)),
});

export function validateSession(session: ReviewSession): ReviewSession {
  const result = sessionSchema.safeParse(session);
  if (!result.success) throw new Error("The authenticator returned an invalid review session.");
  return result.data;
}
