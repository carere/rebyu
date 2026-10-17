import { MousePointer2, Send } from "lucide-solid";
import { For, Show } from "solid-js";
import { m } from "#i18n/messages";
import { getLocale } from "#i18n/runtime";
import type { ReviewModel } from "./App";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { ReviewContext } from "./ReviewContext";
import { ReviewDetailHeader } from "./ReviewDetailHeader";
import { ReviewScreenshot } from "./ReviewScreenshot";
import { initials } from "./view-utils";
export function ReviewDetail(input: { model: ReviewModel }) {
  const { author, user, setAuthor, reply, setReply, busy, current, selectReview, update } =
    input.model;
  return (
    <Show when={current()}>
      {(review) => (
        <div class="detail-scroll">
          <ReviewDetailHeader model={input.model} review={review()} />
          <p class="detail-message">{review().message}</p>
          <div class="author-line">
            <Avatar size="sm">
              <AvatarFallback>{initials(review().author)}</AvatarFallback>
            </Avatar>
            <div>
              <strong>{review().author}</strong>
              <p>{new Date(review().createdAt).toLocaleString(getLocale())}</p>
            </div>
          </div>
          <div class="detail-tools">
            <Button variant="outline" type="button" onClick={() => selectReview(review())}>
              <MousePointer2 size={14} /> {m.review_locate()}
            </Button>
            <ReviewScreenshot
              src={review().screenshot}
              number={review().number}
              portalMount={input.model.props.portalMount}
            />
            <ReviewContext context={review().context} portalMount={input.model.props.portalMount} />
          </div>
          <h3 class="replies-title">{m.review_conversation({ count: review().replies.length })}</h3>
          <For each={review().replies}>
            {(r) => (
              <div class="reply">
                <Avatar size="sm">
                  <AvatarFallback>{initials(r.author)}</AvatarFallback>
                </Avatar>
                <div>
                  <strong>{r.author}</strong>
                  <p>{r.message}</p>
                  <time>{new Date(r.createdAt).toLocaleString(getLocale())}</time>
                </div>
              </div>
            )}
          </For>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reply().trim() && author().trim())
                void update({
                  reply: {
                    id: crypto.randomUUID(),
                    author: author().trim(),
                    authorId: user()?.id,
                    message: reply().trim(),
                  },
                });
            }}
          >
            <Label class="form-field">
              {m.review_your_name()}
              <Input
                required
                maxLength={80}
                value={author()}
                placeholder={m.review_your_name()}
                onInput={(e) => setAuthor(e.currentTarget.value)}
              />
            </Label>
            <Label class="form-field">
              {m.review_reply()}
              <Textarea
                rows={3}
                required
                maxLength={10000}
                value={reply()}
                placeholder={m.review_reply_placeholder()}
                onInput={(e) => setReply(e.currentTarget.value)}
              />
            </Label>
            <Button type="submit" disabled={busy()}>
              {m.review_send_reply()} <Send size={14} />
            </Button>
          </form>
        </div>
      )}
    </Show>
  );
}
