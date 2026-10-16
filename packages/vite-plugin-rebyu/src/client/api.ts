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
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? `Request failed (${response.status})`);
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
