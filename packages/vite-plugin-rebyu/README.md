# @carere/rebyu

Visual UI reviews with an isolated widget and an optional user-deployed backend,
powered by SolidJS and [Zaidan](https://zaidan.carere.dev).

```ts
import { defineConfig } from "vite";
import rebyu from "@carere/rebyu";

export default defineConfig({
  plugins: [rebyu({ projectName: "My website" })],
});
```

Rebyu is free and open-source. Deploy your own service, choose your review storage
through `ReviewRepository`, and configure screenshot storage independently through
`ScreenshotRepository`. File adapters and an S3-compatible screenshot adapter are
included; no managed Rebyu account or storage engine is required. See the
[self-hosting guide](https://github.com/carere/rebyu/blob/main/docs/self-hosting.md)
for the Node CLI, authentication, custom database adapters, and agent access.

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
import type {} from "@carere/rebyu/client";
window.rebyu?.setUser({ id: "user-123", name: "Kevin Abatan" });
// On sign-out: window.rebyu?.setUser(null);
```

This fills **Your name** and stores the stable ID with comments and replies. Call
it on each page load and user change. Names remain editable; without an identity,
manual names are supported. Legacy comments match by name. The API is absent in
production unless hosted widget injection is explicitly enabled; it supplies
attribution, not authentication. The hosted backend derives authors from its
verified authentication session instead of trusting browser-provided identities.

By default, comments persist in `.rebyu/reviews.json` relative to your Vite root.
Add `.rebyu/` to `.gitignore`. The plugin requires a standard Vite HTML pipeline and
is excluded from production builds and `vite preview` by default. For a separately
deployed backend, configure a same-origin `endpoint` and stable `projectId` for
browser storage; `production: true` explicitly includes the widget in builds.
Storage credentials and authentication configuration stay on the backend.

Options: `projectName`, `storageFile`, `endpoint`, `projectId`, `production` (false),
`open` (false), `captureDiagnostics` (false), and `enabled` (true).

The default local API is only for trusted development servers: it accepts
self-declared reviewer names and has no authentication. The independently deployed
backend requires authenticated project/environment scope and permissions. Postgres
and D1 adapters, claim leases, and SitePing migrations are not bundled yet. Full
setup, limitations, and the parity roadmap are in the [repository](https://github.com/carere/rebyu).

MIT · Kevin Abatan. Vendored Zaidan sources retain their MIT notices in THIRD_PARTY_LICENSES.md.
