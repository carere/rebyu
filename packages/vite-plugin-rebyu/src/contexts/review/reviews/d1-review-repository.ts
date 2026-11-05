import {
  type ReviewPatch,
  type ReviewRepository,
  type ReviewScope,
  reviewScopeSchema,
  type StoredNewReview,
  type StoredReview,
} from "./review-repository";

export const d1ReviewSchema = `
CREATE TABLE IF NOT EXISTS rebyu_review (project_id TEXT NOT NULL, environment TEXT NOT NULL, id TEXT NOT NULL, number INTEGER NOT NULL CHECK(number > 0), record TEXT NOT NULL CHECK(json_valid(record)), PRIMARY KEY(project_id, environment, id), UNIQUE(project_id, environment, number));
CREATE TABLE IF NOT EXISTS rebyu_sequence (project_id TEXT NOT NULL, environment TEXT NOT NULL, last_number INTEGER NOT NULL CHECK(last_number >= 0), PRIMARY KEY(project_id, environment));
`;

interface D1ReviewStatement {
  bind(...values: unknown[]): D1ReviewStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

/** The subset of a Cloudflare D1 binding used by this adapter. */
export interface D1ReviewDatabase {
  prepare(query: string): D1ReviewStatement;
  batch<T = unknown>(statements: D1ReviewStatement[]): Promise<{ results: T[] }[]>;
}

const scopedId = "project_id = ? AND environment = ? AND id = ?";
type Row = { record: string };
const decode = (row: Row): StoredReview => JSON.parse(row.record);

export class D1ReviewRepository implements ReviewRepository {
  constructor(private readonly database: D1ReviewDatabase) {}

  private scope(scope: ReviewScope) {
    const { projectId, environment } = reviewScopeSchema.parse(scope);
    return [projectId, environment];
  }

  async list(scope: ReviewScope): Promise<StoredReview[]> {
    const { results } = await this.database
      .prepare(
        "SELECT record FROM rebyu_review WHERE project_id = ? AND environment = ? ORDER BY number",
      )
      .bind(...this.scope(scope))
      .all<Row>();
    return results.map(decode);
  }

  async get(scope: ReviewScope, id: string): Promise<StoredReview | null> {
    const row = await this.database
      .prepare(`SELECT record FROM rebyu_review WHERE ${scopedId}`)
      .bind(...this.scope(scope), id)
      .first<Row>();
    return row ? decode(row) : null;
  }

  async create(scope: ReviewScope, input: StoredNewReview): Promise<StoredReview> {
    const key = this.scope(scope);
    const record = { ...input, status: "open", createdAt: new Date().toISOString(), replies: [] };
    // D1 batches are transactions: allocation and insertion cannot interleave across writers.
    const result = await this.database.batch<Row>([
      this.database
        .prepare(
          `INSERT INTO rebyu_sequence(project_id, environment, last_number) VALUES (?, ?, 1) ON CONFLICT(project_id, environment) DO UPDATE SET last_number = last_number + 1 WHERE NOT EXISTS (SELECT 1 FROM rebyu_review WHERE ${scopedId})`,
        )
        .bind(...key, ...key, input.id),
      this.database
        .prepare(
          "INSERT INTO rebyu_review(project_id, environment, id, number, record) SELECT project_id, environment, ?, last_number, json_set(?, '$.number', last_number) FROM rebyu_sequence WHERE project_id = ? AND environment = ? ON CONFLICT(project_id, environment, id) DO NOTHING",
        )
        .bind(input.id, JSON.stringify(record), ...key),
      this.database
        .prepare(`SELECT record FROM rebyu_review WHERE ${scopedId}`)
        .bind(...key, input.id),
    ]);
    const row = result[2]?.results[0];
    if (!row) throw new Error("Review was not persisted.");
    return decode(row);
  }

  async update(scope: ReviewScope, id: string, patch: ReviewPatch): Promise<StoredReview | null> {
    const key = [...this.scope(scope), id];
    const statements: D1ReviewStatement[] = [];
    if (patch.status)
      statements.push(
        this.database
          .prepare(
            `UPDATE rebyu_review SET record = json_set(record, '$.status', ?) WHERE ${scopedId}`,
          )
          .bind(patch.status, ...key),
      );
    if (patch.reply)
      statements.push(
        this.database
          .prepare(
            `UPDATE rebyu_review SET record = json_insert(record, '$.replies[#]', json(?)) WHERE ${scopedId} AND NOT EXISTS (SELECT 1 FROM json_each(record, '$.replies') WHERE json_extract(value, '$.id') = ?)`,
          )
          .bind(
            JSON.stringify({ ...patch.reply, createdAt: new Date().toISOString() }),
            ...key,
            patch.reply.id,
          ),
      );
    statements.push(
      this.database.prepare(`SELECT record FROM rebyu_review WHERE ${scopedId}`).bind(...key),
    );
    const result = await this.database.batch<Row>(statements);
    const row = result.at(-1)?.results[0];
    return row ? decode(row) : null;
  }

  async remove(scope: ReviewScope, id: string): Promise<boolean> {
    const result = await this.database
      .prepare(`DELETE FROM rebyu_review WHERE ${scopedId}`)
      .bind(...this.scope(scope), id)
      .run();
    return result.meta.changes > 0;
  }
}
