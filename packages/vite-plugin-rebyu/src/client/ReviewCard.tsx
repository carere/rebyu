import { Bug, Lightbulb, MessageCircle } from "lucide-solid";
import { createSignal, createUniqueId, onCleanup, onMount, Show } from "solid-js";
import { m } from "#i18n/messages";
import { getLocale } from "#i18n/runtime";
import type { Review } from "../schema";
import type { ReviewModel } from "./App";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { categoryBadgeVariant, categoryLabel, initials } from "./view-utils";

export function ReviewCard(props: { review: Review; model: ReviewModel }) {
  const [expanded, setExpanded] = createSignal(false);
  const [overflowing, setOverflowing] = createSignal(false);
  const messageId = createUniqueId();
  let message!: HTMLParagraphElement;
  onMount(() => {
    const observer = new ResizeObserver(() => {
      // Four lines at the card's 24px line height; measure actual wrapping on resize.
      setOverflowing(message.scrollHeight > 96);
    });
    observer.observe(message);
    onCleanup(() => observer.disconnect());
  });
  return (
    <Card size="sm" class="review-card-surface shrink-0 gap-0 p-0 shadow-none ring-0">
      <Button
        variant="ghost"
        type="button"
        class="review-card"
        onClick={() => props.model.selectReview(props.review)}
      >
        <div class="card-top">
          <Badge class="review-number">{props.review.number}</Badge>
          <Badge
            variant={categoryBadgeVariant(props.review.category)}
            class="review-category h-7 text-[12px]"
          >
            {props.review.category === "bug" ? (
              <Bug size={12} />
            ) : props.review.category === "idea" ? (
              <Lightbulb size={12} />
            ) : (
              <MessageCircle size={12} />
            )}
            {categoryLabel(props.review.category)}
          </Badge>
          <time class="card-time" dateTime={props.review.createdAt}>
            {new Date(props.review.createdAt).toLocaleDateString(getLocale(), {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>
        <Show when={props.model.unreadFor(props.review) > 0}>
          <Badge variant="destructive" class="card-unread">
            {m.review_unread_replies({ count: props.model.unreadFor(props.review) })}
          </Badge>
        </Show>
        <p ref={message} id={messageId} classList={{ "message-collapsed": !expanded() }}>
          {props.review.message}
        </p>
        <div class="card-bottom">
          <Avatar size="sm">
            <AvatarFallback>{initials(props.review.author)}</AvatarFallback>
          </Avatar>
          <span class="card-author">{props.review.author}</span>
          <Show when={props.review.replies.length}>
            <span class="reply-count">
              <MessageCircle size={12} /> {props.review.replies.length}
            </span>
          </Show>
          <span class="card-page" title={props.review.page}>
            {props.review.page}
          </span>
        </div>
      </Button>
      <Show when={overflowing()}>
        <Button
          variant="link"
          size="sm"
          type="button"
          class="show-message"
          aria-expanded={expanded()}
          aria-controls={messageId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded() ? m.review_show_less() : m.review_show_more()}
        </Button>
      </Show>
    </Card>
  );
}
