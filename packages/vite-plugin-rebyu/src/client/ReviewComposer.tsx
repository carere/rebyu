import { ArrowLeft, ArrowUpRight } from "lucide-solid";
import { Show } from "solid-js";
import { m } from "#i18n/messages";
import { categories } from "../constants";
import type { ReviewModel } from "./App";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { categoryLabel } from "./view-utils";
export function ReviewComposer(input: { model: ReviewModel }) {
  const {
    props,
    draft,
    setDraft,
    message,
    setMessage,
    author,
    setAuthor,
    category,
    setCategory,
    busy,
    capture,
    setCapture,
    start,
    submit,
  } = input.model;
  return (
    <Show when={draft()}>
      {(anchor) => (
        <div class="detail-scroll">
          <Button variant="outline" type="button" class="back-button" onClick={() => setDraft()}>
            <ArrowLeft size={15} /> {m.review_all_comments()}
          </Button>
          <h2>{m.review_composer_title()}</h2>
          <form onSubmit={submit}>
            <Label class="form-field">
              {m.review_your_name()}
              <Input
                required
                maxLength={80}
                placeholder={m.review_name_placeholder()}
                value={author()}
                onInput={(e) => setAuthor(e.currentTarget.value)}
              />
            </Label>
            <Label class="form-field">
              {m.review_comment()}
              <Textarea
                autofocus
                required
                maxLength={10000}
                rows={5}
                placeholder={m.review_comment_placeholder()}
                value={message()}
                onInput={(e) => setMessage(e.currentTarget.value)}
              />
            </Label>
            <Select
              class="review-select"
              options={[...categories]}
              value={category()}
              onChange={(value) => {
                if (value) setCategory(value);
              }}
              itemComponent={(item) => (
                <SelectItem item={item.item}>{categoryLabel(item.item.rawValue)}</SelectItem>
              )}
              modal={false}
            >
              <SelectLabel>{m.review_category()}</SelectLabel>
              <SelectTrigger>
                <SelectValue<(typeof categories)[number]>>
                  {(state) => categoryLabel(state.selectedOption())}
                </SelectValue>
              </SelectTrigger>
              <SelectContent portalMount={props.portalMount} />
            </Select>
            <div class="checkbox-row">
              <Checkbox id="rebyu-capture" checked={capture()} onChange={setCapture} />
              <Label for="rebyu-capture">{m.review_attach_screenshot()}</Label>
            </div>
            <div class="composer-actions">
              <Button type="submit" disabled={busy()}>
                {busy() ? m.review_saving() : m.review_post_comment()}
                <ArrowUpRight size={16} />
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={busy()}
                onClick={() =>
                  start(
                    anchor().kind === "element"
                      ? "element"
                      : anchor().kind === "draw"
                        ? "draw"
                        : "rectangle",
                  )
                }
              >
                {m.review_reselect()}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Show>
  );
}
