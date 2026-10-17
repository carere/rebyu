import { m } from "#i18n/messages";
import type { ClientConfig, NewReview, Review } from "../schema";
export function createApi(config: ClientConfig) {
  const key = `rebyu:outbox:${config.projectId}`;
  function read(): NewReview[] {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  }
  function write(items: NewReview[]) {
    localStorage.setItem(key, JSON.stringify(items));
  }
  async function request(path = "", method = "GET", data?: unknown) {
    const response = await fetch(`${config.endpoint}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    }).catch(() => {
      throw new Error(m.review_connection_error());
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const knownErrors: Record<string, () => string> = {
        "Review not found": m.review_error_not_found,
        "Not found": m.review_error_not_found,
        "Invalid review data": m.review_error_invalid_data,
        "Cross-origin requests are not allowed": m.review_error_cross_origin,
        "Method not allowed": m.review_error_method,
        "Could not save reviews. Check the Vite server log.": m.review_error_server,
      };
      throw new Error(
        knownErrors[error.error]?.() ??
          error.error ??
          m.review_request_failed({ status: response.status }),
      );
    }
    return response.json();
  }
  return {
    list: (): Promise<Review[]> => request(),
    async create(data: NewReview) {
      write([...read().filter((r) => r.id !== data.id), data]);
      await request("", "POST", data);
      write(read().filter((r) => r.id !== data.id));
    },
    async flush() {
      for (const item of read()) {
        await request("", "POST", item);
        write(read().filter((r) => r.id !== item.id));
      }
    },
    pending: () => read().length,
    update: (id: string, data: unknown): Promise<Review> => request(`/${id}`, "PATCH", data),
    remove: (id: string) => request(`/${id}`, "DELETE"),
  };
}
