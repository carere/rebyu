import { createHideOutside } from "@kobalte/core";
import { Image, X } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";
import { m } from "#i18n/messages";
import { OverlayMountContext } from "./components/overlay-mount";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";

export function ReviewScreenshot(props: {
  src?: string;
  number: number;
  portalMount: HTMLElement;
}) {
  const [open, setOpen] = createSignal(false);
  const [content, setContent] = createSignal<HTMLElement>();
  let restoreHost = () => {};
  function changeOpen(value: boolean) {
    restoreHost();
    if (value) {
      const host = (props.portalMount.getRootNode() as ShadowRoot).host;
      const previous = host.getAttribute("data-kb-top-layer");
      // Kobalte's document walker needs a visible light-DOM target for a shadow modal.
      host.setAttribute("data-kb-top-layer", "");
      restoreHost = () => {
        if (previous === null) host.removeAttribute("data-kb-top-layer");
        else host.setAttribute("data-kb-top-layer", previous);
      };
    }
    setOpen(value);
  }
  onCleanup(() => restoreHost());
  // Hide the rest of the widget separately, inside the shadow boundary.
  createHideOutside({
    isDisabled: () => !open() || !content(),
    targets: () => {
      const element = content();
      return element ? [element] : [];
    },
    root: () => props.portalMount,
  });
  return (
    <OverlayMountContext.Provider value={props.portalMount}>
      <Dialog open={open()} onOpenChange={changeOpen}>
        <DialogTrigger
          as={Button}
          variant="outline"
          type="button"
          disabled={!props.src}
          title={props.src ? undefined : m.review_no_screenshot()}
        >
          <Image size={14} /> {m.review_show_screenshot()}
        </DialogTrigger>
        <DialogContent
          ref={setContent}
          class="review-screenshot-dialog z-120"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{m.review_screenshot_title({ number: props.number })}</DialogTitle>
            <DialogDescription>{m.review_screenshot_description()}</DialogDescription>
          </DialogHeader>
          <img src={props.src} alt={m.review_screenshot_alt({ number: props.number })} />
          <DialogClose
            as={Button}
            variant="ghost"
            size="icon-sm"
            class="z-dialog-close"
            aria-label={m.review_close()}
          >
            <X aria-hidden="true" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </OverlayMountContext.Provider>
  );
}
