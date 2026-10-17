import { onCleanup, onMount } from "solid-js";
import type { ReviewModel } from "./App";
import { HOST_ID, isIgnored, makeAnchor } from "./anchors";

function fromWidget(e: Event) {
  return e.composedPath().some((n) => n instanceof Element && n.id === HOST_ID);
}
// Corvu and Kobalte have separate dismissal stacks. Route Escape once here,
// before the popup handles it, so dismissing a menu does not close the drawer.
function popupOwnsKey(event: KeyboardEvent, target: EventTarget | undefined, model: ReviewModel) {
  if (model.props.portalMount.querySelector('[data-slot="dialog-content"][data-expanded]'))
    return true;
  if (event.key === "Escape")
    return !!model.props.portalMount.querySelector(
      '[role="menu"][data-expanded], [data-slot="select-content"][data-expanded], [data-slot="popover-content"][data-expanded]',
    );
  return (
    target instanceof Element &&
    !!target.closest(
      '[data-slot="select-trigger"], [data-slot="select-content"], [data-slot^="dropdown-menu-"], [data-slot="popover-trigger"], [data-slot="popover-content"]',
    )
  );
}

class ReviewEvents {
  private origin: { x: number; y: number; element: Element } | undefined;
  private suppressUntil = 0;
  constructor(private model: ReviewModel) {}
  move = (e: PointerEvent) => {
    const { mode, setHover, setDrawing, setPath } = this.model;

    if (mode() === "browse" || fromWidget(e)) return;
    if (this.origin) {
      const x = Math.min(this.origin.x, e.clientX),
        y = Math.min(this.origin.y, e.clientY);
      setDrawing({
        x,
        y,
        width: Math.abs(e.clientX - this.origin.x),
        height: Math.abs(e.clientY - this.origin.y),
      });
      if (mode() === "draw")
        setPath((p) => (p.length < 1000 ? [...p, { x: e.clientX, y: e.clientY }] : p));
    } else if (mode() === "element" && e.target instanceof Element && !isIgnored(e.target)) {
      const r = e.target.getBoundingClientRect();
      setHover({ x: r.x, y: r.y, width: r.width, height: r.height });
    }
  };
  down = (e: PointerEvent) => {
    const { mode, setDrawing, setPath, draftReview } = this.model;

    if (
      mode() === "browse" ||
      fromWidget(e) ||
      e.button !== 0 ||
      !(e.target instanceof Element) ||
      isIgnored(e.target)
    )
      return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (mode() === "element") {
      draftReview(makeAnchor(e.target, "element"));
      return;
    }
    this.origin = { x: e.clientX, y: e.clientY, element: e.target };
    setDrawing({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
    setPath([{ x: e.clientX, y: e.clientY }]);
  };
  up = (e: PointerEvent) => {
    const { mode, drawing, setDrawing, path, setPath, draftReview } = this.model;

    if (!this.origin) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const area = drawing();
    const start = this.origin;
    this.origin = undefined;
    if (!area || area.width < 4 || area.height < 4) {
      setDrawing();
      setPath([]);
      return;
    }
    let target = start.element;
    while (target.parentElement) {
      const r = target.getBoundingClientRect();
      if (
        r.x <= area.x &&
        r.y <= area.y &&
        r.right >= area.x + area.width &&
        r.bottom >= area.y + area.height
      )
        break;
      target = target.parentElement;
    }
    const points =
      mode() === "draw"
        ? path().map((p) => ({
            x: Math.max(0, Math.min(1, (p.x - area.x) / area.width)),
            y: Math.max(0, Math.min(1, (p.y - area.y) / area.height)),
          }))
        : [];
    draftReview(makeAnchor(target, mode() === "draw" ? "draw" : "rectangle", area, points));
  };
  mark = (e: PointerEvent) => {
    const { mode } = this.model;

    if (mode() !== "browse" && !fromWidget(e)) this.suppressUntil = Date.now() + 600;
  };
  click = (e: MouseEvent) => {
    const { mode } = this.model;

    if (!fromWidget(e) && (mode() !== "browse" || Date.now() < this.suppressUntil)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  key = (e: KeyboardEvent) => {
    const { open, setOpen, mode, active, setDraft, visible, cancel, selectReview, draftReview } =
      this.model;

    const target = e.composedPath()[0];
    if (popupOwnsKey(e, target, this.model)) return;
    if (e.key === "Escape") {
      this.origin = undefined;
      cancel();
      setDraft();
      setOpen(false);
      return;
    }
    if (
      target instanceof HTMLElement &&
      (target.matches("input,textarea,select") || target.isContentEditable)
    )
      return;
    if (e.altKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      setOpen((v) => !v);
      return;
    }
    if (
      mode() === "element" &&
      e.key === "Enter" &&
      target instanceof Element &&
      !fromWidget(e) &&
      !isIgnored(target)
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      draftReview(makeAnchor(target, "element"));
      return;
    }
    if (open() && ["j", "k"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const items = visible();
      const index = items.findIndex((r) => r.id === active());
      const next = items[(index + (e.key === "j" ? 1 : -1) + items.length) % items.length];
      if (next) selectReview(next);
    }
  };
}
function listen<K extends keyof WindowEventMap>(
  type: K,
  listener: (event: WindowEventMap[K]) => unknown,
  capture = false,
) {
  window.addEventListener(type, listener, capture);
  onCleanup(() => window.removeEventListener(type, listener, capture));
}
function observeLayout(model: ReviewModel) {
  let frame = 0;
  const schedule = () => {
    if (!frame)
      frame = requestAnimationFrame(() => {
        model.setTick((v) => v + 1);
        frame = 0;
      });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  const resize = new ResizeObserver(schedule);
  resize.observe(document.body);
  listen("scroll", schedule, true);
  listen("resize", schedule);
  onCleanup(() => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resize.disconnect();
  });
}
export function setupReviewEvents(model: ReviewModel) {
  onMount(() => {
    void model.sync();
    const timer = setInterval(() => void model.sync(), 10000);
    onCleanup(() => clearInterval(timer));
    observeLayout(model);
    const events = new ReviewEvents(model);
    listen("hashchange", model.openLinkedReview);
    listen("online", model.sync);
    listen("pointerdown", events.mark, true);
    listen("pointerdown", events.down, true);
    listen("pointermove", events.move, true);
    listen("pointerup", events.up, true);
    listen("click", events.click, true);
    listen("keydown", events.key, true);
  });
}
