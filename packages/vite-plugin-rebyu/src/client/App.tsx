import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { m } from "#i18n/messages";
import type { categories } from "../constants";
import type { Anchor, ClientConfig, Review } from "../schema";
import { findAnchor, HOST_ID } from "./anchors";
import { createApi } from "./api";
import { useColorMode } from "./components/color-mode";
import { ReviewCanvas } from "./ReviewCanvas";
import { ReviewDrawer } from "./ReviewDrawer";
import { ReviewToolbar } from "./ReviewToolbar";
import { setupReviewEvents } from "./review-events";
import { createReviewFilters } from "./review-filters";
import { createReviewer } from "./reviewer";
import { filterReviews, linkedReviewId, reviewUrl } from "./reviews";

type Mode = "browse" | "element" | "rectangle" | "draw";
type Box = { x: number; y: number; width: number; height: number };
function createReviewModel(props: {
  config: ClientConfig;
  portalMount: HTMLElement;
  page: Accessor<string>;
  errors: string[];
}) {
  const api = createApi(props.config);
  const [open, setOpen] = createSignal(props.config.open),
    [mode, setMode] = createSignal<Mode>("browse");
  const [reviews, setReviews] = createSignal<Review[]>([]),
    [active, setActive] = createSignal<string>(),
    [draft, setDraft] = createSignal<Anchor>();
  const [message, setMessage] = createSignal(""),
    [category, setCategory] = createSignal<(typeof categories)[number]>("feedback");
  const [reply, setReply] = createSignal("");
  const reviewFilters = createReviewFilters();
  const { query, setQuery, mine, setMine, scope, setScope, unreadOnly, setUnreadOnly } =
    reviewFilters;
  const [error, setError] = createSignal(""),
    [busy, setBusy] = createSignal(false),
    [pending, setPending] = createSignal(0),
    [pins, setPins] = createSignal(true),
    [capture, setCapture] = createSignal(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const dark = () => colorMode() === "dark";
  const [hover, setHover] = createSignal<Box>(),
    [drawing, setDrawing] = createSignal<Box>(),
    [path, setPath] = createSignal<{ x: number; y: number }[]>([]),
    [tick, setTick] = createSignal(0);
  const { user, author, setAuthor, unreadFor, unreadCount, markRead } = createReviewer(
    props.config,
    reviews,
  );
  const pageReviews = createMemo(() => reviews().filter((r) => r.page === props.page()));
  const visible = createMemo(() =>
    filterReviews(
      reviews().filter((review) => !unreadOnly() || unreadFor(review) > 0),
      {
        page: props.page(),
        scope: scope(),
        status: "open",
        query: query(),
        author: mine() ? author().trim() || "\0" : undefined,
        authorId: mine() ? user()?.id : undefined,
      },
    ),
  );
  const current = createMemo(() => reviews().find((r) => r.id === active()));
  async function refresh() {
    try {
      setReviews(await api.list());
      setPending(api.pending());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function sync() {
    try {
      await api.flush();
      setPending(api.pending());
      await refresh();
      setError("");
    } catch (e) {
      setPending(api.pending());
      setError((e as Error).message);
    }
  }
  function cancel() {
    setMode("browse");
    setHover();
    setDrawing();
    setPath([]);
  }
  function start(value: Mode) {
    setDraft();
    setActive();
    setMode(value);
    setOpen(false);
    setHover();
  }
  function selectReview(review: Review) {
    if (review.page !== props.page()) {
      try {
        location.assign(reviewUrl(review.page, review.id, location.origin));
      } catch (error) {
        setError((error as Error).message);
      }
      return;
    }
    cancel();
    setDraft();
    setActive(review.id);
    setOpen(true);
    findAnchor(review.anchor)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
  function draftReview(anchor: Anchor) {
    setDraft(anchor);
    setMessage("");
    setActive();
    cancel();
    setOpen(true);
  }
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const anchor = draft();
    if (!anchor || !author().trim() || !message().trim() || busy()) return;
    setBusy(true);
    setError("");
    try {
      if (!user()) localStorage.setItem("rebyu:author", author().trim());
      let screenshot: string | undefined;
      if (capture()) {
        const { toPng } = await import("html-to-image");
        screenshot = await toPng(document.body, {
          width: innerWidth,
          height: innerHeight,
          pixelRatio: 1,
          canvasWidth: Math.min(innerWidth, 1440),
          canvasHeight: Math.min(innerHeight, 1080),
          style: {
            transform: `translate(${-scrollX}px, ${-scrollY}px)`,
            margin: "0",
          },
          filter: (node) =>
            !(node instanceof Element) ||
            !node.matches(`#${HOST_ID},[data-rebyu-ignore],input,textarea,select`),
        });
        if (screenshot.length > 3_000_000) throw new Error(m.review_screenshot_too_large());
      }
      await api.create({
        id: crypto.randomUUID(),
        page: props.page(),
        anchor,
        author: author().trim(),
        authorId: user()?.id,
        message: message().trim(),
        category: category(),
        ...(screenshot ? { screenshot } : {}),
        context: {
          viewport: `${innerWidth} × ${innerHeight}`,
          userAgent: navigator.userAgent,
          errors: [...props.errors],
        },
      });
      setDraft();
      setMessage("");
      await refresh();
    } catch (e) {
      setPending(api.pending());
      setError(
        api.pending()
          ? m.review_outbox_error({ error: (e as Error).message })
          : (e as Error).message,
      );
      if (api.pending()) {
        setDraft();
        setMessage("");
      }
    } finally {
      setBusy(false);
    }
  }
  async function update(data: unknown) {
    const selected = current();
    if (!selected || busy()) return;
    setBusy(true);
    try {
      await api.update(selected.id, data);
      setReply("");
      setError("");
      await refresh();
      if (reviews().find((review) => review.id === selected.id)?.status === "resolved") setActive();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  createEffect(() => {
    props.page();
    cancel();
    setDraft();
    setActive();
  });
  function openLinkedReview() {
    const id = linkedReviewId(location.hash);
    const review = reviews().find((r) => r.id === id && r.page === props.page());
    if (!review) return;
    selectReview(review);
    history.replaceState(history.state, "", location.pathname + location.search);
  }
  createEffect(() => {
    reviews();
    props.page();
    openLinkedReview();
  });
  const [pageVisible, setPageVisible] = createSignal(document.visibilityState === "visible");
  onMount(() => {
    const visibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", visibility);
    onCleanup(() => document.removeEventListener("visibilitychange", visibility));
  });
  createEffect(() => {
    const selected = current();
    if (selected && open() && pageVisible()) markRead(selected);
  });
  const model = {
    filters: reviewFilters.filters,
    setFilters: reviewFilters.setFilters,
    props,
    api,
    open,
    setOpen,
    mode,
    setMode,
    reviews,
    setReviews,
    active,
    setActive,
    draft,
    setDraft,
    message,
    setMessage,
    author,
    setAuthor,
    user,
    unreadFor,
    unreadCount,
    unreadOnly,
    setUnreadOnly,
    category,
    setCategory,
    reply,
    setReply,
    query,
    setQuery,
    mine,
    setMine,
    scope,
    setScope,
    error,
    setError,
    busy,
    setBusy,
    pending,
    setPending,
    pins,
    setPins,
    dark,
    toggleColorMode,
    capture,
    setCapture,
    hover,
    setHover,
    drawing,
    setDrawing,
    path,
    setPath,
    tick,
    setTick,
    pageReviews,
    visible,
    current,
    refresh,
    sync,
    cancel,
    start,
    selectReview,
    draftReview,
    submit,
    update,
    openLinkedReview,
  };
  setupReviewEvents(model);
  return model;
}
export type ReviewModel = ReturnType<typeof createReviewModel>;
export function App(props: Parameters<typeof createReviewModel>[0]) {
  const model = createReviewModel(props);
  return (
    <>
      <ReviewCanvas model={model} />
      <ReviewToolbar model={model} />
      <ReviewDrawer model={model} />
    </>
  );
}
