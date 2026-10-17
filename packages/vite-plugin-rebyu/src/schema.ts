import { z } from "zod";
import { categories, statuses } from "./constants";

const point = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
const anchorSchema = z.object({
  selector: z.string().max(2000),
  xpath: z.string().max(2000),
  text: z.string().max(120),
  tag: z.string().max(40),
  rect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
  }),
  offset: point,
  size: point,
  kind: z.enum(["element", "rectangle", "draw"]),
  points: z.array(point).max(1000).default([]),
});
const author = z.string().trim().min(1).max(80);
export const createSchema = z.object({
  id: z.uuid(),
  page: z.string().startsWith("/").max(2000),
  message: z.string().trim().min(1).max(10000),
  author,
  authorId: z.string().trim().min(1).max(200).optional(),
  category: z.enum(categories),
  anchor: anchorSchema,
  screenshot: z
    .string()
    .max(3_000_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
    .optional(),
  context: z.object({
    viewport: z.string().max(40),
    userAgent: z.string().max(500),
    errors: z.array(z.string().max(1000)).max(20),
  }),
});
const replySchema = z.object({
  id: z.uuid(),
  author,
  authorId: z.string().trim().min(1).max(200).optional(),
  message: z.string().trim().min(1).max(10000),
});
export const patchSchema = z
  .object({
    status: z.enum(statuses).optional(),
    reply: replySchema.optional(),
  })
  .refine((v) => v.status || v.reply, "An update is required");
export type Anchor = z.infer<typeof anchorSchema>;
export type NewReview = z.infer<typeof createSchema>;
export type Review = NewReview & {
  number: number;
  status: (typeof statuses)[number];
  createdAt: string;
  replies: (z.infer<typeof replySchema> & { createdAt: string })[];
};
export interface ClientConfig {
  projectId: string;
  projectName: string;
  endpoint: string;
  clientUrl: string;
  open: boolean;
  captureDiagnostics: boolean;
}
