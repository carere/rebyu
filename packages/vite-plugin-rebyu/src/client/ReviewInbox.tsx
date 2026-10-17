import { MessageCircle, Plus } from "lucide-solid";
import { For, Show } from "solid-js";
import { m } from "#i18n/messages";
import type { ReviewModel } from "./App";
import { Button } from "./components/ui/button";
import { DrawerDescription } from "./components/ui/drawer";
import { ReviewCard } from "./ReviewCard";
import { ReviewFilters } from "./ReviewFilters";
export function ReviewInbox(input: { model: ReviewModel }) {
  const { unreadOnly, draft, query, visible, current, start } = input.model;
  const total = () =>
    input.model.reviews().filter((review) => ["open", "in-progress"].includes(review.status))
      .length;
  const filteredEmpty = () => input.model.filters().length > 0 && input.model.reviews().length > 0;
  return (
    <Show when={!draft() && !current()}>
      <div class="inbox-heading">
        <div>
          <h2>
            {m.review_inbox_title()}
            <span>.</span>
          </h2>
          <DrawerDescription>{m.review_inbox_description()}</DrawerDescription>
        </div>
        <Button class="new-review" onClick={() => start("element")}>
          <Plus size={16} /> {m.review_add_comment()}
        </Button>
      </div>
      <div class="inbox-body">
        <ReviewFilters model={input.model} />
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
                  {unreadOnly()
                    ? m.review_caught_up()
                    : query() || filteredEmpty()
                      ? m.review_no_matches()
                      : m.review_empty_title()}
                </h3>
                <p>
                  {unreadOnly()
                    ? m.review_caught_up_description()
                    : query() || filteredEmpty()
                      ? m.review_no_matches_description()
                      : m.review_empty_description()}
                </p>
                <Show when={!input.model.reviews().length && !unreadOnly()}>
                  <Button variant="outline" onClick={() => start("element")}>
                    <Plus size={14} /> {m.review_leave_comment()}
                  </Button>
                </Show>
              </div>
            }
          >
            {(review) => <ReviewCard review={review} model={input.model} />}
          </For>
        </div>
        <div class="review-total" role="status" aria-live="polite">
          {m.review_total({ shown: visible().length, total: total() })}
        </div>
      </div>
    </Show>
  );
}
