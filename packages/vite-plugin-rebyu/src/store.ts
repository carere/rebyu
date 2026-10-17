import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { createSchema, type NewReview, patchSchema, type Review } from "./schema";

const storedSchema = createSchema.extend({
  number: z.number().int().positive(),
  status: z.enum(["open", "in-progress", "resolved", "dismissed"]),
  createdAt: z.iso.datetime(),
  replies: z.array(
    z.object({
      id: z.uuid(),
      author: z.string(),
      authorId: z.string().trim().min(1).max(200).optional(),
      message: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
const documentSchema = z.object({
  version: z.literal(1),
  nextNumber: z.number().int().positive(),
  reviews: z.array(storedSchema),
});
type StoreDocument = z.infer<typeof documentSchema>;
export class ReviewStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(readonly file: string) {}
  private async read(): Promise<StoreDocument> {
    try {
      return documentSchema.parse(JSON.parse(await readFile(this.file, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { version: 1, nextNumber: 1, reviews: [] };
      throw error;
    }
  }
  async list() {
    await this.queue;
    return (await this.read()).reviews;
  }
  private mutate<T>(fn: (reviews: Review[], document: StoreDocument) => T): Promise<T> {
    const task = this.queue.then(async () => {
      const document = await this.read();
      const value = fn(document.reviews, document);
      await mkdir(dirname(this.file), { recursive: true });
      const temporary = `${this.file}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(document, null, 2), {
        mode: 0o600,
      });
      await rename(temporary, this.file);
      return value;
    });
    this.queue = task.catch(() => {});
    return task;
  }
  create(input: NewReview) {
    const data = createSchema.parse(input);
    return this.mutate((reviews, document) => {
      const existing = reviews.find((r) => r.id === data.id);
      if (existing) return existing;
      const review: Review = {
        ...data,
        number: document.nextNumber++,
        status: "open",
        createdAt: new Date().toISOString(),
        replies: [],
      };
      reviews.push(review);
      return review;
    });
  }
  update(id: string, input: unknown) {
    const patch = patchSchema.parse(input);
    const reply = patch.reply;
    return this.mutate((reviews) => {
      const review = reviews.find((r) => r.id === id);
      if (!review) return null;
      if (patch.status) review.status = patch.status;
      if (reply && !review.replies.some((r) => r.id === reply.id))
        review.replies.push({
          ...reply,
          createdAt: new Date().toISOString(),
        });
      return review;
    });
  }
  remove(id: string) {
    return this.mutate((reviews) => {
      const index = reviews.findIndex((r) => r.id === id);
      if (index < 0) return false;
      reviews.splice(index, 1);
      return true;
    });
  }
}
