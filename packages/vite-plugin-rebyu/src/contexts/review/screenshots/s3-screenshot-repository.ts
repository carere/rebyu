import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import type { ReviewScope } from "../reviews/review-repository";
import { screenshotPath } from "./screenshot-path";
import type { ScreenshotRepository } from "./screenshot-repository";

export interface S3ScreenshotOptions {
  client: S3Client;
  bucket: string;
  prefix?: string;
}

export class S3ScreenshotRepository implements ScreenshotRepository {
  constructor(private readonly options: S3ScreenshotOptions) {
    if (!options.bucket.trim()) throw new Error("A screenshot bucket is required.");
  }

  private object(scope: ReviewScope, key: string) {
    const prefix = this.options.prefix?.replace(/^\/+|\/+$/g, "");
    return {
      Bucket: this.options.bucket,
      Key: [prefix, screenshotPath(scope, key)].filter(Boolean).join("/"),
    };
  }

  async put(scope: ReviewScope, key: string, png: Uint8Array) {
    await this.options.client.send(
      new PutObjectCommand({
        ...this.object(scope, key),
        Body: png,
        ContentType: "image/png",
        CacheControl: "private, no-store",
      }),
    );
  }

  async get(scope: ReviewScope, key: string) {
    try {
      const result = await this.options.client.send(new GetObjectCommand(this.object(scope, key)));
      if (!result.Body) throw new Error("Screenshot object has no body.");
      return await result.Body.transformToByteArray();
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
        return null;
      throw error;
    }
  }

  async remove(scope: ReviewScope, key: string) {
    await this.options.client.send(new DeleteObjectCommand(this.object(scope, key)));
  }
}
