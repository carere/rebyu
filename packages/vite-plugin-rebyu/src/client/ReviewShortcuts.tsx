import { Check, CircleHelp } from "lucide-solid";
import { m } from "#i18n/messages";
import { Button } from "./components/ui/button";
import { Kbd, KbdGroup } from "./components/ui/kbd";
import {
  Popover,
  PopoverCloseButton,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "./components/ui/popover";

export function ReviewShortcuts(props: { portalMount: HTMLElement }) {
  return (
    <Popover modal={false} placement="bottom-end">
      <PopoverTrigger
        as={Button}
        variant="ghost"
        type="button"
        title={m.review_keyboard_shortcuts()}
        aria-label={m.review_keyboard_shortcuts()}
      >
        <CircleHelp size={16} />
      </PopoverTrigger>
      <PopoverContent portalMount={props.portalMount} class="w-80 max-w-[calc(100vw-32px)]">
        <PopoverTitle>{m.review_shortcuts_title()}</PopoverTitle>
        <dl class="grid gap-3 text-xs">
          <div class="flex items-center justify-between gap-4">
            <dt>{m.review_shortcut_toggle()}</dt>
            <dd>
              <KbdGroup>
                <Kbd>Alt</Kbd>
                <span>+</span>
                <Kbd>R</Kbd>
              </KbdGroup>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt>{m.review_cancel_annotation()}</dt>
            <dd>
              <Kbd>{m.review_key_escape()}</Kbd>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt>{m.review_shortcut_navigate()}</dt>
            <dd>
              <KbdGroup>
                <Kbd>J</Kbd>
                <span>/</span>
                <Kbd>K</Kbd>
              </KbdGroup>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4">
            <dt>{m.review_shortcut_select()}</dt>
            <dd>
              <KbdGroup>
                <Kbd>Tab</Kbd>
                <span>{m.review_shortcut_then()}</span>
                <Kbd>{m.review_key_enter()}</Kbd>
              </KbdGroup>
            </dd>
          </div>
        </dl>
        <PopoverCloseButton
          as={Button}
          variant="outline"
          type="button"
          class="self-end"
          aria-label={m.review_got_it()}
        >
          {m.review_got_it()} <Check size={13} />
        </PopoverCloseButton>
      </PopoverContent>
    </Popover>
  );
}
