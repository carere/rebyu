import { ArrowLeft, ArrowUpRight } from "lucide-solid";
import { For, Show } from "solid-js";
import { categories } from "../constants";
import type { ReviewModel } from "./App";
import { Button } from "./components/ui/button";
export function ReviewComposer(input: { model: ReviewModel }) {
  const {
    draft,
    setDraft,
    message,
    setMessage,
    author,
    setAuthor,
    category,
    setCategory,
    busy,
    capture,
    setCapture,
    start,
    submit,
  } = input.model;
  return (
    <Show when={draft()}>
      {(anchor) => (
        <div class="detail-scroll">
          <button type="button" class="back-button" onClick={() => setDraft()}>
            <ArrowLeft size={15} /> All comments
          </button>
          <p class="eyebrow">YOUR PERSPECTIVE MATTERS</p>
          <h2>What caught your eye?</h2>
          <p class="muted">A little context makes a big difference.</p>
          <div class="anchor-label">
            <span class="live-dot" />
            {anchor().kind === "element"
              ? `<${anchor().tag}> element selected`
              : anchor().kind === "draw"
                ? "Freehand annotation"
                : "Area selected"}
            <button
              type="button"
              onClick={() =>
                start(
                  anchor().kind === "element"
                    ? "element"
                    : anchor().kind === "draw"
                      ? "draw"
                      : "rectangle",
                )
              }
            >
              Reselect
            </button>
          </div>
          <form onSubmit={submit}>
            <label>
              Your name
              <input
                required
                maxLength={80}
                placeholder="e.g. Alex Morgan"
                value={author()}
                onInput={(e) => setAuthor(e.currentTarget.value)}
              />
            </label>
            <label>
              Comment
              <textarea
                autofocus
                required
                maxLength={10000}
                rows={5}
                placeholder="What could we improve here?"
                value={message()}
                onInput={(e) => setMessage(e.currentTarget.value)}
              />
            </label>
            <label>
              Category
              <select
                value={category()}
                onChange={(e) => setCategory(e.currentTarget.value as (typeof categories)[number])}
              >
                <For each={categories}>
                  {(c) => <option value={c}>{c[0].toUpperCase() + c.slice(1)}</option>}
                </For>
              </select>
            </label>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={capture()}
                onChange={(e) => setCapture(e.currentTarget.checked)}
              />{" "}
              Attach a screenshot of this viewport
            </label>
            <p class="small muted">
              Inputs and elements marked data-rebyu-ignore are excluded. Check the page for
              sensitive text before attaching.
            </p>
            <Button type="submit" disabled={busy()} class="submit-button">
              {busy() ? "Saving…" : "Post comment"}
              <ArrowUpRight size={16} />
            </Button>
          </form>
        </div>
      )}
    </Show>
  );
}
