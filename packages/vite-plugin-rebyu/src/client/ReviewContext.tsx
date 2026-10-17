import { Info } from "lucide-solid";
import { For, Show } from "solid-js";
import { m } from "#i18n/messages";
import type { Review } from "../schema";
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./components/ui/popover";

export function ReviewContext(props: { context: Review["context"]; portalMount: HTMLElement }) {
  return (
    <Popover modal={false} placement="bottom-end">
      <PopoverTrigger as={Button} variant="outline" type="button">
        <Info size={14} /> {m.review_info()}
      </PopoverTrigger>
      <PopoverContent portalMount={props.portalMount} class="review-context">
        <PopoverTitle>{m.review_browser_context()}</PopoverTitle>
        <dl>
          <div>
            <dt>{m.review_viewport()}</dt>
            <dd>{props.context.viewport}</dd>
          </div>
          <div>
            <dt>{m.review_user_agent()}</dt>
            <dd>{props.context.userAgent}</dd>
          </div>
          <div>
            <dt>{m.review_console_errors()}</dt>
            <dd>
              <Show when={props.context.errors.length} fallback={m.review_no_errors()}>
                <For each={props.context.errors}>{(error) => <p>{error}</p>}</For>
              </Show>
            </dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
