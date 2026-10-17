import {
  Eye,
  EyeOff,
  List,
  MessageCircle,
  MousePointer2,
  Pencil,
  ScanLine,
  Square,
  X,
} from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { m } from "#i18n/messages";
import type { ReviewModel } from "./App";
import { Badge } from "./components/ui/badge";
import { Button, type ButtonProps } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
export function ReviewToolbar(input: { model: ReviewModel }) {
  const {
    props,
    setOpen,
    setActive,
    setDraft,
    setScope,
    setQuery,
    setMine,
    mode,
    pins,
    setPins,
    unreadCount,
    setUnreadOnly,
    cancel,
    start,
  } = input.model;
  const [expanded, setExpanded] = createSignal(false);
  const [annotationTools, setAnnotationTools] = createSignal(false);
  function expand(value: boolean) {
    setExpanded(value);
    if (!value) setAnnotationTools(false);
  }
  function reviews(unread = false) {
    cancel();
    setActive();
    setDraft();
    setUnreadOnly(unread);
    if (unread) {
      setQuery("");
      setMine(false);
    }
    setScope("all");
    expand(false);
    setOpen(true);
  }
  function annotate(value: "element" | "rectangle" | "draw") {
    expand(false);
    start(value);
  }
  return (
    <div class="review-launcher">
      <Popover placement="top" gutter={12} open={expanded()} onOpenChange={expand} modal={false}>
        <Tooltip openDelay={200} placement="left">
          <TooltipTrigger
            as={(buttonProps: ButtonProps) => <PopoverTrigger as={Button} {...buttonProps} />}
            size="icon"
            class="launcher-trigger"
            aria-label={expanded() ? m.review_close_tools() : m.review_open_tools()}
            aria-describedby="rebyu-unread-status"
          >
            <Show when={expanded()} fallback={<MessageCircle size={23} />}>
              <X size={24} />
            </Show>
            <Show when={unreadCount() > 0}>
              <Badge variant="destructive" class="launcher-unread" aria-hidden="true">
                {unreadCount() > 99 ? "99+" : unreadCount()}
              </Badge>
            </Show>
          </TooltipTrigger>
          <TooltipContent
            portalMount={props.portalMount}
            side="left"
            class="pointer-events-auto motion-reduce:animate-none"
          >
            {expanded() ? m.review_close_tools() : m.review_open_tools()}
          </TooltipContent>
        </Tooltip>
        <span id="rebyu-unread-status" class="sr-only" role="status" aria-live="polite">
          {m.review_unread_conversations({ count: unreadCount() })}
        </span>
        <PopoverContent
          portalMount={props.portalMount}
          class="launcher-menu w-auto gap-3 border-0 bg-transparent p-0 shadow-none ring-0"
          data-side="top"
        >
          <PopoverTitle class="sr-only">{m.review_review_tools()}</PopoverTitle>
          <PopoverDescription class="sr-only">
            {m.review_review_tools_description()}
          </PopoverDescription>
          <Tooltip openDelay={200} placement="left">
            <TooltipTrigger
              as={Button}
              variant="secondary"
              size="icon"
              class="launcher-action"
              aria-label={pins() ? m.review_hide_pins() : m.review_show_pins()}
              aria-pressed={pins()}
              onClick={() => {
                setPins((value) => !value);
                expand(false);
              }}
            >
              {pins() ? <Eye size={22} /> : <EyeOff size={22} />}
            </TooltipTrigger>
            <TooltipContent
              portalMount={props.portalMount}
              side="left"
              class="pointer-events-auto motion-reduce:animate-none"
            >
              {pins() ? m.review_hide_pins() : m.review_show_pins()}
            </TooltipContent>
          </Tooltip>
          <Popover
            placement="left-end"
            gutter={12}
            open={annotationTools()}
            onOpenChange={setAnnotationTools}
            modal={false}
          >
            <Tooltip openDelay={200} placement="left">
              <TooltipTrigger
                as={(buttonProps: ButtonProps) => <PopoverTrigger as={Button} {...buttonProps} />}
                variant="secondary"
                size="icon"
                class="launcher-action"
                aria-label={m.review_annotation_tools()}
              >
                <ScanLine size={20} />
              </TooltipTrigger>
              <TooltipContent
                portalMount={props.portalMount}
                side="left"
                class="pointer-events-auto motion-reduce:animate-none"
              >
                {m.review_annotation_tools()}
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              portalMount={props.portalMount}
              class="annotation-tools w-auto flex-row gap-2 border-0 bg-transparent p-0 shadow-none ring-0"
              data-side="left"
            >
              <PopoverTitle class="sr-only">{m.review_annotation_tools()}</PopoverTitle>
              <PopoverDescription class="sr-only">
                {m.review_annotation_description()}
              </PopoverDescription>
              <Tooltip openDelay={200} placement="top">
                <TooltipTrigger
                  as={Button}
                  variant="secondary"
                  size="icon"
                  class="launcher-action"
                  aria-label={m.review_select_element()}
                  onClick={() => annotate("element")}
                >
                  <MousePointer2 size={21} />
                </TooltipTrigger>
                <TooltipContent
                  portalMount={props.portalMount}
                  side="top"
                  class="pointer-events-auto motion-reduce:animate-none"
                >
                  {m.review_select_element()}
                </TooltipContent>
              </Tooltip>
              <Tooltip openDelay={200} placement="top">
                <TooltipTrigger
                  as={Button}
                  variant="secondary"
                  size="icon"
                  class="launcher-action"
                  aria-label={m.review_draw_rectangle()}
                  onClick={() => annotate("rectangle")}
                >
                  <Square size={21} />
                </TooltipTrigger>
                <TooltipContent
                  portalMount={props.portalMount}
                  side="top"
                  class="pointer-events-auto motion-reduce:animate-none"
                >
                  {m.review_draw_rectangle()}
                </TooltipContent>
              </Tooltip>
              <Tooltip openDelay={200} placement="top">
                <TooltipTrigger
                  as={Button}
                  variant="secondary"
                  size="icon"
                  class="launcher-action"
                  aria-label={m.review_freehand()}
                  onClick={() => annotate("draw")}
                >
                  <Pencil size={21} />
                </TooltipTrigger>
                <TooltipContent
                  portalMount={props.portalMount}
                  side="top"
                  class="pointer-events-auto motion-reduce:animate-none"
                >
                  {m.review_freehand()}
                </TooltipContent>
              </Tooltip>
              <Show when={mode() !== "browse"}>
                <Tooltip openDelay={200} placement="top">
                  <TooltipTrigger
                    as={Button}
                    variant="secondary"
                    size="icon"
                    class="launcher-action"
                    aria-label={m.review_cancel_annotation()}
                    onClick={() => {
                      cancel();
                      expand(false);
                    }}
                  >
                    <X size={22} />
                  </TooltipTrigger>
                  <TooltipContent
                    portalMount={props.portalMount}
                    side="top"
                    class="pointer-events-auto motion-reduce:animate-none"
                  >
                    {m.review_cancel_annotation()}
                  </TooltipContent>
                </Tooltip>
              </Show>
            </PopoverContent>
          </Popover>
          <Tooltip openDelay={200} placement="left">
            <TooltipTrigger
              as={Button}
              variant="secondary"
              size="icon"
              class="launcher-action"
              aria-label={m.review_all_reviews()}
              onClick={() => reviews()}
            >
              <List size={23} />
            </TooltipTrigger>
            <TooltipContent
              portalMount={props.portalMount}
              side="left"
              class="pointer-events-auto motion-reduce:animate-none"
            >
              {m.review_all_reviews()}
            </TooltipContent>
          </Tooltip>
          <Tooltip openDelay={200} placement="left">
            <TooltipTrigger
              as={Button}
              variant="secondary"
              size="icon"
              class="launcher-action"
              aria-label={m.review_needs_reply()}
              aria-describedby="rebyu-unread-status"
              onClick={() => reviews(true)}
            >
              <MessageCircle size={22} />
              <Show when={unreadCount() > 0}>
                <Badge variant="destructive" class="launcher-reply-count" aria-hidden="true">
                  {unreadCount() > 99 ? "99+" : unreadCount()}
                </Badge>
              </Show>
            </TooltipTrigger>
            <TooltipContent
              portalMount={props.portalMount}
              side="left"
              class="pointer-events-auto motion-reduce:animate-none"
            >
              {m.review_needs_reply()}
            </TooltipContent>
          </Tooltip>
        </PopoverContent>
      </Popover>
    </div>
  );
}
