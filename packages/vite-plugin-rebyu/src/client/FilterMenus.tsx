import type { DropdownMenuRootProps, DropdownMenuSubProps } from "@kobalte/core/dropdown-menu";
import {
  type ComponentProps,
  createContext,
  createSignal,
  createUniqueId,
  splitProps,
  useContext,
} from "solid-js";
import {
  DropdownMenuContent as Content,
  DropdownMenu as Menu,
  DropdownMenuSub as Sub,
} from "./components/ui/dropdown-menu";

// Focus transitions within a ShadowRoot do not reach document-level listeners.
// Coordinate sibling submenus here while keeping Zaidan's rendering and motion.
const SubmenuContext = createContext<{
  active: () => string | undefined;
  change: (id: string, open: boolean) => void;
  close: () => void;
}>();

export function FilterMenu(props: DropdownMenuRootProps) {
  const [active, setActive] = createSignal<string>();
  return (
    <SubmenuContext.Provider
      value={{
        active,
        change: (id, open) =>
          setActive((current) => (open ? id : current === id ? undefined : current)),
        close: () => setActive(undefined),
      }}
    >
      <Menu
        modal={false}
        {...props}
        onOpenChange={(open) => {
          if (!open) setActive(undefined);
          props.onOpenChange?.(open);
        }}
      />
    </SubmenuContext.Provider>
  );
}

export function FilterSubmenu(props: DropdownMenuSubProps) {
  const group = useContext(SubmenuContext);
  const id = createUniqueId();
  return (
    <Sub
      {...props}
      open={group?.active() === id}
      onOpenChange={(open) => {
        group?.change(id, open);
        props.onOpenChange?.(open);
      }}
    />
  );
}

export function FilterMenuContent(props: ComponentProps<typeof Content>) {
  const group = useContext(SubmenuContext);
  const [local, others] = splitProps(props, ["onFocusIn", "onPointerMove"]);
  return (
    <Content
      {...others}
      onPointerMove={(event) => {
        if (
          event.target instanceof Element &&
          event.currentTarget.contains(event.target) &&
          !event.target.closest('[data-slot="dropdown-menu-sub-trigger"]')
        )
          group?.close();
        if (typeof local.onPointerMove === "function") local.onPointerMove(event);
      }}
      onFocusIn={(event) => {
        if (event.target instanceof Node && event.currentTarget.contains(event.target))
          group?.close();
        if (typeof local.onFocusIn === "function") local.onFocusIn(event);
      }}
    />
  );
}
