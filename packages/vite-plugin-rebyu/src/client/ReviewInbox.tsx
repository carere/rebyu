import { Bug, Lightbulb, MessageCircle, Plus, Search, SlidersHorizontal } from "lucide-solid";
import { For, Show } from "solid-js";
import type { ReviewModel } from "./App";
import { Button } from "./components/ui/button";
import { DrawerDescription } from "./components/ui/drawer";
import type { ReviewScope } from "./reviews";
import { initials } from "./view-utils";
export function ReviewInbox(input: { model: ReviewModel }) {
  const {
    props,
    draft,
    query,
    setQuery,
    filter,
    setFilter,
    mine,
    setMine,
    scope,
    setScope,
    visible,
    current,
    count,
    start,
    selectReview,
  } = input.model;
  return (
    <Show when={!draft() && !current()}>
      <div class="inbox-heading">
        <div>
          <p class="eyebrow">A FRESH PAIR OF EYES</p>
          <h2>
            Let’s make it better<span>.</span>
          </h2>
          <DrawerDescription>Good feedback starts right where it happens.</DrawerDescription>
        </div>
        <Button class="new-review" onClick={() => start("element")}>
          <Plus size={16} /> Add a comment
        </Button>
      </div>
      <fieldset class="filter-tabs" aria-label="Review status">
        <button
          type="button"
          classList={{ active: filter() === "open" }}
          onClick={() => setFilter("open")}
        >
          Unresolved <span>{count()}</span>
        </button>
        <button
          type="button"
          classList={{ active: filter() === "resolved" }}
          onClick={() => setFilter("resolved")}
        >
          Resolved
        </button>
        <button
          type="button"
          classList={{ active: filter() === "all" }}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </fieldset>
      <div class="search-row">
        <Search size={15} />
        <input
          aria-label="Search comments"
          placeholder="Search comments…"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <button
          type="button"
          title="Show only my comments"
          aria-label="Show only my comments"
          aria-pressed={mine()}
          classList={{ chosen: mine() }}
          onClick={() => setMine((v) => !v)}
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>
      <div class="list-caption">
        <span>
          {visible().length} {visible().length === 1 ? "COMMENT" : "COMMENTS"}
          {mine() ? " · BY YOU" : ""}
        </span>
        <select
          aria-label="Review pages"
          value={scope()}
          onChange={(e) => setScope(e.currentTarget.value as ReviewScope)}
        >
          <option value="all">All pages</option>
          <option value="page">This page</option>
        </select>
      </div>
      <div class="review-list">
        <For
          each={visible()}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">
                <MessageCircle size={25} />
                <span>+</span>
              </div>
              <h3>
                {query()
                  ? "No matching comments"
                  : filter() === "resolved"
                    ? "A little progress goes a long way"
                    : "Every detail deserves a look"}
              </h3>
              <p>
                {query()
                  ? "Try another search or change your filters."
                  : filter() === "resolved"
                    ? "Resolved comments will find their home here."
                    : "Select an element or draw on the page to leave your first piece of feedback."}
              </p>
              <Show when={!query() && filter() !== "resolved"}>
                <Button variant="outline" onClick={() => start("element")}>
                  <Plus size={14} /> Leave a comment
                </Button>
              </Show>
            </div>
          }
        >
          {(review) => (
            <button type="button" class="review-card" onClick={() => selectReview(review)}>
              <div class="card-top">
                <span class="card-number">{review.number}</span>
                <span class={`category ${review.category}`}>
                  {review.category === "bug" ? (
                    <Bug size={12} />
                  ) : review.category === "idea" ? (
                    <Lightbulb size={12} />
                  ) : (
                    <MessageCircle size={12} />
                  )}{" "}
                  {review.category}
                </span>
                <span class="card-time">
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div class="review-page">
                <span>{review.page}</span>
                <span>{review.page === props.page() ? "CURRENT PAGE" : "OPEN PAGE ↗"}</span>
              </div>
              <p>{review.message}</p>
              <div class="card-bottom">
                <span class="avatar">{initials(review.author)}</span>
                <span>{review.author}</span>
                <Show when={review.replies.length}>
                  <span class="reply-count">
                    <MessageCircle size={12} />
                    {review.replies.length}
                  </span>
                </Show>
                <span class={`status-dot ${review.status}`} />
              </div>
            </button>
          )}
        </For>
      </div>
      <div class="inbox-note">
        <span class="note-line" />
        <span>Small notes. Thoughtful changes.</span>
        <span class="note-line" />
      </div>
    </Show>
  );
}
