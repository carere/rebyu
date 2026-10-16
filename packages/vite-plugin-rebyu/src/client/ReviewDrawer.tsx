import { ArrowDownToLine, Check, CircleHelp, Moon, RotateCcw, Sun, X } from "lucide-solid";
import { Show } from "solid-js";
import type { ReviewModel } from "./App";
import { Drawer, DrawerContent, DrawerTitle } from "./components/ui/drawer";
import { ReviewComposer } from "./ReviewComposer";
import { ReviewDetail } from "./ReviewDetail";
import { ReviewInbox } from "./ReviewInbox";
export function ReviewDrawer(input: { model: ReviewModel }) {
  const {
    props,
    open,
    setOpen,
    error,
    setError,
    pending,
    dark,
    setDark,
    help,
    setHelp,
    sync,
    exportReviews,
  } = input.model;
  return (
    <Show when={open()}>
      <Drawer
        side="right"
        open={open()}
        onOpenChange={setOpen}
        modal={false}
        trapFocus={false}
        closeOnOutsidePointer={false}
        closeOnOutsideFocus={false}
        preventScroll={false}
      >
        <DrawerContent portalMount={props.portalMount} class="review-drawer" data-corvu-no-drag>
          <header class="drawer-header">
            <div class="drawer-brand">
              <span class="mini-mark">r↗</span>
              <DrawerTitle>
                rebyu<span class="beta">BETA</span>
              </DrawerTitle>
            </div>
            <div class="header-actions">
              <button
                type="button"
                title="Toggle theme"
                aria-label="Toggle theme"
                onClick={() => setDark((v) => !v)}
              >
                {dark() ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                title="Close reviews"
                aria-label="Close reviews"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </header>
          <div class="project-label">
            <span class="live-dot" />
            {props.config.projectName}
            <span>LOCAL</span>
          </div>
          <Show when={error()}>
            <div class="notice" role="alert">
              {error()}
              <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={13} />
              </button>
            </div>
          </Show>
          <Show when={pending()}>
            <button type="button" class="sync-notice" onClick={() => void sync()}>
              <RotateCcw size={14} />
              {pending()} pending · Retry sync
            </button>
          </Show>
          <ReviewInbox model={input.model} />
          <ReviewComposer model={input.model} />
          <ReviewDetail model={input.model} />
          <Show when={help()}>
            <div class="help-panel">
              <strong>A shortcut to better feedback</strong>
              <p>
                <kbd>Alt R</kbd> Toggle reviews
                <br />
                <kbd>Esc</kbd> Cancel annotation
                <br />
                <kbd>J</kbd> / <kbd>K</kbd> Next / previous comment
                <br />
                Select mode: <kbd>Tab</kbd> then <kbd>Enter</kbd>
              </p>
              <button type="button" onClick={() => setHelp(false)}>
                Got it <Check size={13} />
              </button>
            </div>
          </Show>
          <footer class="drawer-footer">
            <span>
              <span class="live-dot" />
              {pending()
                ? "Waiting to sync"
                : error()
                  ? "Connection needs attention"
                  : "Saved on your server"}
            </span>
            <div>
              <button
                type="button"
                title="Export filtered reviews"
                aria-label="Export filtered reviews"
                onClick={exportReviews}
              >
                <ArrowDownToLine size={15} />
              </button>
              <button
                type="button"
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
                onClick={() => setHelp((v) => !v)}
              >
                <CircleHelp size={16} />
              </button>
            </div>
          </footer>
        </DrawerContent>
      </Drawer>
    </Show>
  );
}
