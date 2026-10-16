import { X } from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import type { ReviewModel } from "./App";
import { anchorBox } from "./anchors";
import { boxStyle } from "./view-utils";
export function ReviewCanvas(input: { model: ReviewModel }) {
  const { mode, active, pins, hover, drawing, path, tick, pageReviews, cancel, selectReview } =
    input.model;
  return (
    <>
      <Show when={pins() && mode() === "browse"}>
        <For
          each={pageReviews().filter(
            (r) => !["resolved", "dismissed"].includes(r.status) || r.id === active(),
          )}
        >
          {(review) => {
            const box = createMemo(() => {
              tick();
              return anchorBox(review.anchor);
            });
            return (
              <>
                <Show when={active() === review.id}>
                  <div class="annotation selected" style={boxStyle(box())}>
                    <Show when={review.anchor.kind === "draw"}>
                      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          points={review.anchor.points
                            .map((p) => `${p.x * 100},${p.y * 100}`)
                            .join(" ")}
                        />
                      </svg>
                    </Show>
                  </div>
                </Show>
                <button
                  type="button"
                  class="pin"
                  classList={{ "pin-active": active() === review.id }}
                  aria-label={`Open comment ${review.number}`}
                  title={`#${review.number} · ${review.message}${box().attached ? "" : " (element moved)"}`}
                  style={{ left: `${box().x}px`, top: `${box().y}px` }}
                  onClick={() => selectReview(review)}
                >
                  {review.number}
                </button>
              </>
            );
          }}
        </For>
      </Show>
      <Show when={mode() === "element" ? hover() : undefined}>
        {(box) => <div class="annotation hover" style={boxStyle(box())} />}
      </Show>
      <Show when={drawing()}>
        {(box) => (
          <div
            class="annotation"
            style={boxStyle(box())}
            classList={{ freehand: mode() === "draw" }}
          >
            <Show when={mode() === "draw"}>
              <svg aria-hidden="true" viewBox={`0 0 ${box().width || 1} ${box().height || 1}`}>
                <polyline
                  points={path()
                    .map((p) => `${p.x - box().x},${p.y - box().y}`)
                    .join(" ")}
                />
              </svg>
            </Show>
          </div>
        )}
      </Show>
      <Show when={mode() !== "browse"}>
        <div class="mode-hint">
          <span class="live-dot" />
          {mode() === "element"
            ? "Click an element, or Tab to it and press Enter"
            : mode() === "draw"
              ? "Draw around the part you want to review"
              : "Drag to select an area"}
          <button type="button" onClick={cancel}>
            Esc <X size={13} />
          </button>
        </div>
      </Show>
    </>
  );
}
