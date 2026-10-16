import { ArrowLeft, MousePointer2, Send, Trash2 } from "lucide-solid";
import { For, Show } from "solid-js";
import { statuses } from "../constants";
import type { ReviewModel } from "./App";
import { Button } from "./components/ui/button";
import { initials, statusLabel } from "./view-utils";
export function ReviewDetail(input: { model: ReviewModel }) {
  const {
    api,
    setActive,
    author,
    setAuthor,
    reply,
    setReply,
    setError,
    busy,
    setBusy,
    current,
    refresh,
    selectReview,
    update,
  } = input.model;
  return (
    <Show when={current()}>
      {(review) => (
        <div class="detail-scroll">
          <button type="button" class="back-button" onClick={() => setActive()}>
            <ArrowLeft size={15} /> All comments
          </button>
          <div class="detail-heading">
            <span class="card-number">{review().number}</span>
            <span class={`category ${review().category}`}>{review().category}</span>
            <span class="muted small">{review().page}</span>
          </div>
          <p class="detail-message">{review().message}</p>
          <div class="author-line">
            <span class="avatar">{initials(review().author)}</span>
            <div>
              <strong>{review().author}</strong>
              <p>{new Date(review().createdAt).toLocaleString()}</p>
            </div>
          </div>
          <label>
            Status
            <select
              disabled={busy()}
              value={review().status}
              onChange={(e) => void update({ status: e.currentTarget.value })}
            >
              <For each={statuses}>{(s) => <option value={s}>{statusLabel(s)}</option>}</For>
            </select>
          </label>
          <Button variant="outline" class="locate-button" onClick={() => selectReview(review())}>
            <MousePointer2 size={14} /> Locate on page
          </Button>
          <Show when={review().screenshot}>
            <a
              href={review().screenshot}
              target="_blank"
              rel="noreferrer"
              aria-label="Open screenshot"
            >
              <img
                class="screenshot"
                src={review().screenshot}
                alt="Page captured when this review was submitted"
              />
            </a>
          </Show>
          <details class="context">
            <summary>Browser context · {review().context.viewport}</summary>
            <p>{review().context.userAgent}</p>
            <For each={review().context.errors}>{(e) => <pre>{e}</pre>}</For>
          </details>
          <h3 class="replies-title">
            Conversation <span>{review().replies.length}</span>
          </h3>
          <For each={review().replies}>
            {(r) => (
              <div class="reply">
                <span class="avatar">{initials(r.author)}</span>
                <div>
                  <strong>{r.author}</strong>
                  <p>{r.message}</p>
                  <time>{new Date(r.createdAt).toLocaleString()}</time>
                </div>
              </div>
            )}
          </For>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reply().trim() && author().trim())
                void update({
                  reply: {
                    id: crypto.randomUUID(),
                    author: author().trim(),
                    message: reply().trim(),
                  },
                });
            }}
          >
            <label>
              Your name
              <input
                required
                maxLength={80}
                value={author()}
                placeholder="Your name"
                onInput={(e) => setAuthor(e.currentTarget.value)}
              />
            </label>
            <label>
              Reply
              <textarea
                rows={3}
                required
                maxLength={10000}
                value={reply()}
                placeholder="Add to the conversation…"
                onInput={(e) => setReply(e.currentTarget.value)}
              />
            </label>
            <Button type="submit" disabled={busy()}>
              Send reply <Send size={14} />
            </Button>
          </form>
          <details class="delete-confirm">
            <summary>Delete comment</summary>
            <p>This permanently removes this comment and its replies.</p>
            <Button
              variant="destructive"
              disabled={busy()}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.remove(review().id);
                  setActive();
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={14} /> Delete permanently
            </Button>
          </details>
        </div>
      )}
    </Show>
  );
}
