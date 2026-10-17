import {
  type Accessor,
  batch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { installClientApi } from "../client-api";
import type { ClientConfig, Review } from "../schema";
import { reviewerIdentity, reviewerKey, unreadReplies } from "./notifications";

function savedName() {
  try {
    return localStorage.getItem("rebyu:author") ?? "";
  } catch {
    return "";
  }
}
function readReceipts(key: string): Set<string> {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set(
      Array.isArray(values) ? values.filter((id): id is string => typeof id === "string") : [],
    );
  } catch {
    return new Set();
  }
}
export function createReviewer(config: ClientConfig, reviews: Accessor<Review[]>) {
  const api = installClientApi();
  const [user, setUser] = createSignal(api.getUser());
  const [author, setAuthor] = createSignal(user()?.name ?? savedName());
  const reviewer = createMemo(() => reviewerIdentity(user(), author()));
  const receiptKey = createMemo(() => `rebyu:read:${config.projectId}:${reviewerKey(reviewer())}`);
  const [read, setRead] = createSignal<ReadonlySet<string>>(new Set());
  createEffect(() => setRead(readReceipts(receiptKey())));
  const unreadFor = (review: Review) => unreadReplies(review, reviewer(), read()).length;
  const unreadCount = createMemo(() =>
    reviews().reduce((count, review) => count + unreadFor(review), 0),
  );
  function markRead(review: Review) {
    const replies = unreadReplies(review, reviewer(), read());
    if (!replies.length) return;
    const next = new Set([...read(), ...replies.map((reply) => reply.id)]);
    setRead(next);
    try {
      localStorage.setItem(receiptKey(), JSON.stringify([...next]));
    } catch {
      /* Keep receipts in memory if storage is unavailable. */
    }
  }
  onMount(() => {
    const identify = () => {
      const current = api.getUser();
      batch(() => {
        setUser(current);
        setAuthor(current?.name ?? "");
      });
      try {
        localStorage.removeItem("rebyu:author");
      } catch {
        /* Identity still updates without storage. */
      }
    };
    const storage = (event: StorageEvent) => {
      if (event.key === receiptKey()) setRead(readReceipts(receiptKey()));
    };
    window.addEventListener("rebyu:user", identify);
    window.addEventListener("storage", storage);
    onCleanup(() => {
      window.removeEventListener("rebyu:user", identify);
      window.removeEventListener("storage", storage);
    });
  });
  return { user, author, setAuthor, unreadFor, unreadCount, markRead };
}
