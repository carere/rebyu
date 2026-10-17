import { Languages } from "lucide-solid";
import { createSignal, For } from "solid-js";
import { m } from "#i18n/messages";
import { getLocale, type Locale, locales } from "#i18n/runtime";
import { OverlayMountContext } from "./components/overlay-mount";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { changeLocale } from "./localization";

const names = { en: "English", fr: "Français" } satisfies Record<Locale, string>;

export function ReviewLanguage(props: { portalMount: HTMLElement }) {
  const [open, setOpen] = createSignal(false);
  async function select(value: string) {
    await changeLocale(value);
    setOpen(false);
  }
  return (
    <OverlayMountContext.Provider value={props.portalMount}>
      <DropdownMenu modal={false} placement="bottom-end" open={open()} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          as={Button}
          variant="ghost"
          type="button"
          title={m.review_language()}
          aria-label={m.review_language()}
        >
          <Languages size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value={getLocale()} onChange={(value) => void select(value)}>
            <For each={locales}>
              {(value) => (
                <DropdownMenuRadioItem value={value}>{names[value]}</DropdownMenuRadioItem>
              )}
            </For>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </OverlayMountContext.Provider>
  );
}
