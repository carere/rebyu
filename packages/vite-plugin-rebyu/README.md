# vite-plugin-rebyu

Visual reviews on your Vite development server, powered by SolidJS and [Zaidan](https://zaidan.carere.dev).

```ts
import { defineConfig } from "vite";
import rebyu from "vite-plugin-rebyu";

export default defineConfig({
  plugins: [rebyu({ projectName: "My website" })],
});
```

No framework imports or styles are required in your app. The widget bundles its own runtime, renders inside a Shadow DOM, and uses a right-side review drawer. Select elements, draw rectangles or freehand sketches, leave numbered comments, reply, and resolve comments. The drawer lists comments from all pages by default; use the Page filter to narrow the list. Text search, author, page, and unread replies are combined through Zaidan’s Filters block. A bottom counter shows matching comments out of the unresolved total. Selecting a comment from another page navigates to its annotation. Screenshots and uncaught error diagnostics are opt-in.

Use **Language** in the drawer header to choose English or French. This translates
the widget immediately and preserves unfinished comments. The preference uses its
own `rebyu_locale` cookie. The host page and authored comments keep their original
language; host applications do not need to install Paraglide or supply catalogs.

Open the bottom-right trigger to reveal the tools above it. Its red pill counts
unread replies by other people in conversations you started or replied to, across
all pages. **Needs your reply** lists them; opening a conversation marks it as read.
Read receipts are local to this browser and scoped to the project and reviewer.

Your application can identify its current reviewer before or after widget mount:

```ts
import type {} from "vite-plugin-rebyu/client";
window.rebyu?.setUser({ id: "user-123", name: "Kevin Abatan" });
// On sign-out: window.rebyu?.setUser(null);
```

This fills **Your name** and stores the stable ID with comments and replies. Call
it on each page load and user change. Names remain editable; without an identity,
manual names are supported. Legacy comments match by name. The API is absent in
production; it supplies attribution, not authentication.

Comments persist in `.rebyu/reviews.json` relative to your Vite root. Add `.rebyu/` to `.gitignore`. Requires a standard Vite HTML pipeline. The plugin runs only in development and is excluded from production builds and `vite preview`.

Options: `projectName`, `storageFile`, `open` (false), `captureDiagnostics` (false), and `enabled` (true).

This is an initial implementation for trusted development servers, with self-declared reviewer names and no production authentication. Full setup, limitations, and the SitePing parity roadmap are in the [repository](https://github.com/carere/rebyu).

MIT · Kevin Abatan. Vendored Zaidan sources retain their MIT notices in THIRD_PARTY_LICENSES.md.
