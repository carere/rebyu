import { Eye, EyeOff, MessageCircle, MousePointer2, Pencil, Square } from "lucide-solid";
import type { ReviewModel } from "./App";
export function ReviewToolbar(input: { model: ReviewModel }) {
  const { open, setOpen, mode, pins, setPins, count, cancel, start } = input.model;
  return (
    <div
      class="toolbar"
      classList={{ "toolbar-shift": open() }}
      role="toolbar"
      aria-label="Review tools"
    >
      <button
        type="button"
        class="brand-mark"
        aria-label="Open Rebyu"
        onClick={() => {
          cancel();
          setOpen((v) => !v);
        }}
      >
        r<span>↗</span>
      </button>
      <span class="tool-divider" />
      <button
        type="button"
        title="Browse page"
        aria-label="Browse page"
        classList={{ chosen: mode() === "browse" }}
        onClick={cancel}
      >
        <MousePointer2 size={18} />
      </button>
      <button
        type="button"
        title="Select an element"
        aria-label="Select an element"
        classList={{ chosen: mode() === "element" }}
        onClick={() => start("element")}
      >
        <MessageCircle size={18} />
      </button>
      <button
        type="button"
        title="Draw a rectangle"
        aria-label="Draw a rectangle"
        classList={{ chosen: mode() === "rectangle" }}
        onClick={() => start("rectangle")}
      >
        <Square size={18} />
      </button>
      <button
        type="button"
        title="Draw freehand"
        aria-label="Draw freehand"
        classList={{ chosen: mode() === "draw" }}
        onClick={() => start("draw")}
      >
        <Pencil size={18} />
      </button>
      <span class="tool-divider" />
      <button
        type="button"
        aria-label={pins() ? "Hide pins" : "Show pins"}
        title={pins() ? "Hide pins" : "Show pins"}
        onClick={() => setPins((v) => !v)}
      >
        {pins() ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      <button
        type="button"
        class="comments-toggle"
        aria-label="Toggle reviews"
        onClick={() => {
          cancel();
          setOpen((v) => !v);
        }}
      >
        Reviews <span>{count()}</span>
      </button>
    </div>
  );
}
