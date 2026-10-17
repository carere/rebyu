import { ArrowLeft, Bug, Check, Lightbulb, MessageCircle, Trash2 } from "lucide-solid";
import { m } from "#i18n/messages";
import type { Review } from "../schema";
import type { ReviewModel } from "./App";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./components/ui/popover";
import { categoryBadgeVariant, categoryLabel } from "./view-utils";

function DeleteReviewAction(props: { model: ReviewModel; review: Review }) {
  async function remove() {
    props.model.setBusy(true);
    try {
      await props.model.api.remove(props.review.id);
      props.model.setActive();
      await props.model.refresh();
    } catch (error) {
      props.model.setError((error as Error).message);
    } finally {
      props.model.setBusy(false);
    }
  }
  return (
    <Popover modal={false} placement="bottom-end">
      <PopoverTrigger
        as={Button}
        variant="outline"
        size="icon"
        type="button"
        class="detail-delete"
        aria-label={m.review_delete_comment()}
        title={m.review_delete_comment()}
        disabled={props.model.busy()}
      >
        <Trash2 size={14} />
      </PopoverTrigger>
      <PopoverContent portalMount={props.model.props.portalMount} class="delete-confirm">
        <PopoverTitle>{m.review_delete_title()}</PopoverTitle>
        <PopoverDescription>{m.review_delete_description()}</PopoverDescription>
        <Button variant="destructive" disabled={props.model.busy()} onClick={() => void remove()}>
          <Trash2 size={14} /> {m.review_delete_permanently()}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function ReviewDetailHeader(props: { model: ReviewModel; review: Review }) {
  return (
    <div class="detail-toolbar">
      <Button variant="outline" type="button" onClick={() => props.model.setActive()}>
        <ArrowLeft size={15} /> {m.review_all_comments()}
      </Button>
      <Badge class="review-number">{props.review.number}</Badge>
      <Badge
        variant={categoryBadgeVariant(props.review.category)}
        class="review-category h-7 text-[12px]"
      >
        {props.review.category === "bug" ? (
          <Bug size={14} />
        ) : props.review.category === "idea" ? (
          <Lightbulb size={14} />
        ) : (
          <MessageCircle size={14} />
        )}
        {categoryLabel(props.review.category)}
      </Badge>
      <span class="detail-page" title={props.review.page}>
        {props.review.page}
      </span>
      <div class="detail-actions">
        <Button
          size="icon"
          variant="outline"
          type="button"
          class="detail-resolve"
          disabled={props.model.busy()}
          aria-label={m.review_resolve_comment()}
          title={m.review_resolve_comment()}
          onClick={() => void props.model.update({ status: "resolved" })}
        >
          <Check size={14} />
        </Button>
        <DeleteReviewAction model={props.model} review={props.review} />
      </div>
    </div>
  );
}
