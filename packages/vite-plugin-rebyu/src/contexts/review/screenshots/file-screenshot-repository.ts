import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ReviewScope } from "../reviews/review-repository";
import { screenshotPath } from "./screenshot-path";
import type { ScreenshotRepository } from "./screenshot-repository";

export class FileScreenshotRepository implements ScreenshotRepository {
  constructor(private readonly directory: string) {}

  async put(scope: ReviewScope, key: string, png: Uint8Array) {
    const file = resolve(this.directory, screenshotPath(scope, key));
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    await mkdir(dirname(file), { recursive: true });
    try {
      await writeFile(temporary, png, { mode: 0o600 });
      await rename(temporary, file);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async get(scope: ReviewScope, key: string) {
    try {
      return new Uint8Array(await readFile(resolve(this.directory, screenshotPath(scope, key))));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async remove(scope: ReviewScope, key: string) {
    await rm(resolve(this.directory, screenshotPath(scope, key)), { force: true });
  }
}
