# Zaidan

Dialog was added through `bunx --bun shadcn@4.21.0 add @zaidan/dialog --yes
--cwd packages/vite-plugin-rebyu`. Its portal reads the widget's shared overlay-mount
context to keep the screenshot dialog inside the ShadowRoot; its styles and animations
remain upstream defaults.
The Rebyu screenshot composition marks the shadow host as a Kobalte top layer only
while open, and scopes Kobalte's `createHideOutside` to the widget as well. This keeps
the document-level modal walker from hiding `body` when its target is inside a shadow
tree. The host's previous marker is restored on close or disposal.

Registry primitives (Drawer, Button, Popover, Badge, Select, Input, Textarea, Label,
Checkbox, Tabs, Toggle, Separator, Avatar, Card, Alert, Collapsible, and Tooltip),
plus ColorModeProvider, were reinstalled from Zaidan's registry on 2026-10-17 using:

```sh
bunx --bun shadcn@4.21.0 add @zaidan/button @zaidan/drawer @zaidan/popover \
  @zaidan/badge @zaidan/select @zaidan/input @zaidan/textarea @zaidan/label \
  @zaidan/checkbox @zaidan/tabs @zaidan/toggle @zaidan/separator @zaidan/avatar \
  @zaidan/card @zaidan/alert @zaidan/collapsible @zaidan/tooltip @zaidan/color-mode \
  --yes --overwrite --cwd packages/vite-plugin-rebyu
```

The CLI resolved `https://zaidan.carere.dev/r/kobalte/<name>.json` and found
Collapsible already identical. Imports use the configured `#utils` package alias.
After installation, the widget's integration adaptations were reapplied: Drawer,
Popover, Select, and Tooltip accept a ShadowRoot portal mount; DrawerContent accepts
an optional backdrop flag for non-modal use. Popover and Select expose their existing
open state as `data-open` to match the upstream style recipes (Kobalte also emits
`data-expanded`). Reduced motion uses Tailwind's built-in motion variants on overlay
content. Label retains its consumer-controlled accessibility lint exception, and
Tooltip retains line-limit exceptions to preserve the upstream implementation.
Default component styles and animation definitions are unchanged.

The Filters block and its ButtonGroup, DropdownMenu, InputGroup, Kbd, and ScrollArea
dependencies were installed through `bunx --bun shadcn@4.21.0 add @zaidan/filters
--yes --overwrite --cwd packages/vite-plugin-rebyu` on 2026-10-17. The generated
block files were moved into `src/client/components/blocks/filters/` to follow the
widget layout. Dropdown menus use a shared overlay-mount context and non-modal
behavior to preserve host-page interaction; Tooltip accepts that context as a
fallback. The option loader retains a documented function-length lint exception.
Filter removal buttons and text editors receive accessible names. The block uses
its existing i18n configuration for translated labels; the removal button's label
also reads that configuration instead of a fixed English string. Rebyu supplies
its screenshot dialog close button to localize the label through composition.
The block uses Rebyu-owned menu adapters to coordinate sibling submenus inside the
ShadowRoot, where document-level focus listeners cannot observe internal focus transitions.
`styles/shadow-base.css` applies Zaidan’s standard base border and outline colors.
The build-time `postcss/shadow-properties.ts` adapter copies Tailwind’s generated
compatibility defaults into the widget scope. This covers borders, pseudo-elements,
shadows, and focus rings without hand-maintained property overrides or host CSS.
Short select fields disable searching, following the official Filters examples.
Non-modal behavior is set in Rebyu’s menu adapter; the primitive root retains its
upstream default. Rebyu’s adapter checks physical DOM containment before handling
parent-menu events, so events bubbling through Solid portals from submenu options
do not dismiss those options. The drawer delegates Escape routing to Rebyu’s
keyboard handler so dismissing a Kobalte menu does not also dismiss the Corvu drawer.
Upstream primitive styles are retained.

Mira was installed on 2026-10-17 with:

```sh
bunx --bun shadcn@4.21.0 add @zaidan/style-mira --yes --overwrite --cwd packages/vite-plugin-rebyu
```

As described in Zaidan's customization docs, the CLI-generated CSS files were moved
from `src/styles/` into `src/client/styles/` to match this widget's layout. The
injected semantic colors already exist in the scoped `theme.css`; duplicate
imports and unscoped scaffolding were removed from the entry stylesheet.

`src/client/styles/base.css` is Zaidan's CLI-installed `style-mira.css` and
`src/client/styles/utilities.css` is its shared utilities file, both installed through Zaidan’s registry CLI. Their upstream animation definitions
are retained; Rebyu defines no animation keyframes. `tw-animate-css` is imported as
in Delimoov's design-system stylesheet. Rebyu-specific composition and annotation
geometry live separately in `styles/reviews.css`.

ColorModeProvider is installed from the Zaidan `color-mode` registry item. It applies
theme classes to the widget root and uses the `rebyu-color-mode` cookie instead of
changing the host document. Both setters persist the selected mode. Theme tokens originate from Zaidan's `src/styles.css`, with Rebyu's green palette
applied in `theme.css`; selectors are scoped to `.rebyu-root`
and fonts use system fallbacks without external font requests.

MIT License

Copyright (c) 2025 Kevin Abatan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
