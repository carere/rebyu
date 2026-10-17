import { X } from "lucide-solid";
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { m } from "#i18n/messages";
import type { ReviewModel } from "./App";
import { anchorBox } from "./anchors";
import { Button } from "./components/ui/button";
import { pinPosition } from "./pins";
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
            let pin: HTMLButtonElement | undefined;
            const [size, setSize] = createSignal({ width: 27, height: 27 });
            onMount(() => {
              if (!pin) return;
              const measure = () => {
                if (pin) setSize({ width: pin.offsetWidth, height: pin.offsetHeight });
              };
              measure();
              const observer = new ResizeObserver(measure);
              observer.observe(pin);
              onCleanup(() => observer.disconnect());
            });
            const position = createMemo(() => {
              tick();
              return pinPosition(box(), size(), { width: innerWidth, height: innerHeight });
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
                <Button
                  variant="default"
                  type="button"
                  ref={pin}
                  class="pin"
                  classList={{ "pin-active": active() === review.id }}
                  aria-label={m.review_open_comment({ number: review.number })}
                  title={`#${review.number} · ${review.message}${box().attached ? "" : m.review_element_moved()}`}
                  style={{
                    left: `${position().x}px`,
                    top: `${position().y}px`,
                    visibility: position().visible ? "visible" : "hidden",
                  }}
                  onClick={() => selectReview(review)}
                >
                  {review.number}
                </Button>
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
            ? m.review_hint_element()
            : mode() === "draw"
              ? m.review_hint_draw()
              : m.review_hint_rectangle()}
          <Button
            variant="ghost"
            type="button"
            aria-label={m.review_cancel_annotation()}
            onClick={cancel}
          >
            {m.review_key_escape()} <X size={13} />
          </Button>
        </div>
      </Show>
    </>
  );
}
