import { Moon, RotateCcw, Sun, X } from "lucide-solid";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { m } from "#i18n/messages";
import rebyuIcon from "../../../../assets/icon.svg?inline";
import type { ReviewModel } from "./App";
import { Alert, AlertAction, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./components/ui/drawer";
import { ReviewComposer } from "./ReviewComposer";
import { ReviewDetail } from "./ReviewDetail";
import { ReviewInbox } from "./ReviewInbox";
import { ReviewLanguage } from "./ReviewLanguage";
import { ReviewShortcuts } from "./ReviewShortcuts";
export function ReviewDrawer(input: { model: ReviewModel }) {
  const { props, open, setOpen, error, setError, pending, dark, toggleColorMode, sync } =
    input.model;
  const [drawerOpen, setDrawerOpen] = createSignal(open());
  let opening = false;
  let disposed = false;
  let frame = 0;
  createEffect(() => {
    const requested = open();
    if (requested || !opening) setDrawerOpen(requested);
  });
  onCleanup(() => {
    disposed = true;
    cancelAnimationFrame(frame);
  });
  function contentPresent(present: boolean) {
    cancelAnimationFrame(frame);
    opening = present;
    if (present) {
      // Let Corvu's two-frame opening setup finish before accepting a close.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
              opening = false;
              setDrawerOpen(open());
            });
          });
        });
      });
      return;
    }
    if (!open()) return;
    // Corvu finishes an interrupted exit before accepting another open request.
    setDrawerOpen(false);
    queueMicrotask(() => {
      if (!disposed && open()) setDrawerOpen(true);
    });
  }
  return (
    <Drawer
      side="right"
      open={drawerOpen()}
      onOpenChange={setOpen}
      onContentPresentChange={contentPresent}
      modal={false}
      trapFocus={false}
      closeOnEscapeKeyDown={false}
      closeOnOutsidePointer={false}
      closeOnOutsideFocus={false}
      preventScroll={false}
    >
      <DrawerContent
        portalMount={props.portalMount}
        class="review-drawer rounded-none p-0 before:inset-0 before:rounded-none"
        overlay={false}
        data-corvu-no-drag
      >
        <DrawerHeader class="drawer-header">
          <div class="drawer-brand">
            <img class="brand-icon" src={rebyuIcon} width="28" height="28" alt="" />
            <DrawerTitle class="drawer-title">
              <span>rebyu</span>
              <span class="project-separator" aria-hidden="true" />
              <span class="project-name" title={props.config.projectName}>
                {props.config.projectName}
              </span>
            </DrawerTitle>
          </div>
          <div class="header-actions">
            <ReviewLanguage portalMount={props.portalMount} />
            <Button
              variant="ghost"
              type="button"
              title={m.review_toggle_theme()}
              aria-label={m.review_toggle_theme()}
              onClick={toggleColorMode}
            >
              {dark() ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <ReviewShortcuts portalMount={props.portalMount} />
            <Button
              variant="ghost"
              type="button"
              title={m.review_close_reviews()}
              aria-label={m.review_close_reviews()}
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </DrawerHeader>
        <Show when={error()}>
          <Alert class="notice" variant="destructive">
            <AlertDescription>{error()}</AlertDescription>
            <AlertAction>
              <Button
                variant="ghost"
                type="button"
                aria-label={m.review_dismiss_error()}
                onClick={() => setError("")}
              >
                <X size={13} />
              </Button>
            </AlertAction>
          </Alert>
        </Show>
        <Show when={pending()}>
          <Button variant="ghost" type="button" class="sync-notice" onClick={() => void sync()}>
            <RotateCcw size={14} />
            {m.review_pending_sync({ count: pending() })}
          </Button>
        </Show>
        <ReviewInbox model={input.model} />
        <ReviewComposer model={input.model} />
        <ReviewDetail model={input.model} />
      </DrawerContent>
    </Drawer>
  );
}
