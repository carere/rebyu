<img src="assets/icon.svg" width="64" height="64" alt="">

# rebyu

Visual UI reviews for Vite. Select an element, draw a rectangle, or sketch on the page, then leave a numbered comment. Review conversations live in a right-side Zaidan drawer.

This is an initial working implementation, not full SitePing feature parity. See [the parity roadmap](docs/siteping-parity.md).

## Run locally

The workspace pins Node.js **24.21.0**, Bun **1.4.2**, and Moon **2.5.4** in
`.prototools`. Install [proto](https://moonrepo.dev/docs/proto/install) **0.62.3**
and [Cocogitto](https://docs.cocogitto.io/guide/installation.html) **6.5.0+**.
Moon is also a locked development dependency; `bun moon` runs that local binary.

```sh
proto install
bun install --frozen-lockfile
bun lefthook install
bun moon sync
bun moon run website:seed # optional: eight sample reviews, existing reviews preserved
bun moon run website:dev
```

Open http://localhost:5173 for the website. Its public review example runs entirely
in the browser; the real review widget is also available during development.
`website:preview` serves the production site without the development widget.
The website is a vanilla TypeScript Vite app targeting `rebyu.carere.dev`: the host does not need SolidJS,
Zaidan, Tailwind, or component imports. The plugin bundles its runtime and styles.
Run seed before the dev server starts so a single process owns the review file.

The widget stylesheet follows Delimoov’s design-system entry: Tailwind,
`tw-animate-css`, theme tokens, and component base styles. Drawer transitions keep
the content mounted through their 400ms exit and respect reduced-motion settings.

Moon owns project tasks and their dependency graph. Package manifests contain no
scripts. The dev task builds the plugin first; the plugin build orders its bundled
client before its Node entry. Builds declare outputs for Moon's local cache. Test
and seed tasks are not cached.

```sh
bun moon run vite-plugin-rebyu:build website:build
bun tsc --noEmit
bun biome check . --error-on-warnings
bun knip
bun sort-package-json --check package.json 'apps/*/package.json' 'packages/*/package.json'
bun moon run vite-plugin-rebyu:test-unit vite-plugin-rebyu:test-integration
cd packages/vite-plugin-rebyu
bunx --bun playwright install chromium # once
cd ../..
bun moon run vite-plugin-rebyu:test-browser website:test-browser
cog check --ignore-merge-commits
```

Use `bun biome check --write .` for fixes. Biome owns formatting, linting, and import
organization; Prettier is not installed. VS Code recommendations select Biome.
Lefthook sorts staged package manifests and applies Biome fixes before a commit,
then validates its Conventional Commit message using `cog verify`.

CI repeats the static checks, Moon builds, and separate unit, integration, and browser test tasks
on pull requests and pushes to main. PR metadata checks Conventional Commits, titles,
and the body template from `.agents/skills/pr/SKILL.md`. Its validator checks structure
and placeholders, not the truth of evidence. UI PRs require video evidence per the
skill. All workflows use standard GitHub runners and the pinned proto setup action;
there is no project-specific remote cache. The website uses Cloudflare Workers static assets;
see [website hosting](docs/website-hosting.md). After the first local npm release, run
**Actions → Release to npm → Run workflow** on `main` to open a release PR. Merging
that PR tags, tests, and publishes the next version. See [the release guide](docs/releases.md).

Add Zaidan components through the CLI using the package's `components.json`:

```sh
bunx --bun shadcn@4.21.0 add @zaidan/tooltip --yes --cwd packages/vite-plugin-rebyu
```

The widget uses Zaidan’s Mira style, installed with:

```sh
bunx --bun shadcn@4.21.0 add @zaidan/style-mira --yes --overwrite --cwd packages/vite-plugin-rebyu
```

Move CLI-generated `src/styles/base.css` and `utilities.css` into
`src/client/styles/` for this package’s custom layout. Keep the existing entry
imports and scoped semantic colors rather than duplicate CLI scaffolding.

The workspace aliases use package subpath imports. Overlay primitives must mount
inside the widget ShadowRoot. The client build copies Tailwind’s generated
property defaults into that scope, and `styles/shadow-base.css` applies Zaidan’s
base border/outline rules. Launcher tooltips appear after a 200ms hover delay.

Read [CODING_STANDARD.md](CODING_STANDARD.md) before contributing. Agent workflows
and their Rebyu-specific configuration live in [AGENTS.md](AGENTS.md),
[.agents/skills/README.md](.agents/skills/README.md), and `docs/agents/`.

## Translations

The widget supports English and French. Open **Language** in its header to switch
without reloading the reviewed site or losing an unfinished comment. The choice
persists in the `rebyu_locale` cookie; English is the default and the fallback for an
unsupported value. The widget updates its own `lang` and `dir`, leaving the host
page's language, URL, and locale cookies unchanged. Review messages, author names,
paths, and captured browser diagnostics remain as recorded.

Like Delimoov, the workspace follows Paraglide's
[shared-project, per-package compilation pattern](https://paraglidejs.com/monorepo).
Edit `messages/en.json` and `messages/fr.json` at the repository root. The shared
`project.inlang/settings.json` defines the supported languages. The plugin's
`paraglide.config.ts` configures typed output under its ignored `src/i18n/` folder;
imports use the package's `#i18n/*` alias. Host projects need no Paraglide setup.

```sh
bun moon run vite-plugin-rebyu:i18n # generate messages and TypeScript declarations
bun moon run vite-plugin-rebyu:build # also regenerates the bundled widget
```

Moon tracks both catalogs and the shared settings as inputs. Build and test tasks
generate their dependencies automatically; unit tests wait for the client build
so the Vite compiler cannot replace generated files during test imports.
Date formatting uses the selected language, and count messages use Paraglide plural
variants. Catalog tests check translation coverage and matching interpolation inputs;
browser tests cover switching, draft preservation, filters, and persisted preferences.

## Add to a Vite project

Once the first release is published, install it from npm:

```sh
npm install -D @carere/rebyu
```

To try an unpublished build, build and pack it from this repository:

```sh
bun moon run vite-plugin-rebyu:build
cd packages/vite-plugin-rebyu
npm pack
# In your other Vite project:
npm install -D /absolute/path/to/carere-rebyu-0.1.0.tgz
```

Add it alongside your existing framework plugins:

```ts
import { defineConfig } from "vite";
import rebyu from "@carere/rebyu";

export default defineConfig({
  plugins: [rebyu({ projectName: "My website" })],
});
```

This plugin uses Vite's `configureServer` and `transformIndexHtml` hooks. It runs in `vite dev`, is excluded from production builds and `vite preview`, and respects Vite's base path. Standard Vite HTML entry projects work without framework adapters. SSR frameworks with custom HTML pipelines may need an explicit injection integration; that is not implemented yet.

## Review flow

- Open the bottom-right trigger to reveal four icon buttons: pin visibility, annotation tools, all reviews, and conversations needing your reply. The annotation icon opens element, rectangle, and freehand tools.
- **Select** an element with the comment tool. Keyboard users can enter select mode, Tab to a host element, and press Enter.
- **Draw** an area with the rectangle tool, or sketch with the pencil.
- Add your name, message, and a feedback / bug / idea category. Screenshots are optional.
- Click a numbered badge to locate its annotation and open the conversation.
- Reply or resolve comments, search, or filter comments by author, page, and unread replies through the Zaidan Filters block. Resolving returns to the inbox and hides the comment and its pin. The bottom count shows matching comments out of the unresolved total. Long card messages expand with Show more / Show less.
- The drawer defaults to **All pages**. Add a **Page · Current page** filter to narrow the list. Each comment shows its page path; selecting a comment on another page navigates there, opens its conversation, and locates its annotation. Pins remain local to the current page.
- Toggle pins, switch between light and dark themes, or open keyboard shortcuts from the drawer header.

`Alt+R` toggles reviews; `Esc` cancels selection and closes the drawer. `J` and `K` move through the filtered comment list outside text fields. Page identity includes pathname and query string, but excludes hash fragments.

The widget uses Zaidan’s semantic theme tokens and color-mode provider with Rebyu’s green light/dark palette. It starts
from the saved `rebyu-color-mode` cookie or the system preference. The drawer’s
theme toggle saves the choice. Theme classes and dropdowns stay inside Rebyu’s
Shadow DOM, leaving the host application’s theme independent.

## Identify the reviewer

Call the browser API from your app when its user becomes available, and again when
that user changes. The plugin installs it before application scripts, so calls made
before the widget mounts are retained.

```ts
// Optional TypeScript declaration (no runtime import):
import type {} from "@carere/rebyu/client";

window.rebyu?.setUser({ id: "user-123", name: "Kevin Abatan" });
window.rebyu?.getUser(); // { id: "user-123", name: "Kevin Abatan" }
// On sign-out:
window.rebyu?.setUser(null);
```

The name fills **Your name** in new comments and replies. A stable user ID is saved
with each submission, so changing a display name keeps the same participation.
Call `setUser` on every page load or authentication change; identities are held in
memory. Without an identity, reviewers can still enter a name manually. Signing
out clears the name. Use optional chaining because the API is absent in production
and when the plugin is disabled. IDs must be 1–200 characters; names 1–80 characters.
This API attributes comments; it does not authenticate users or enforce access.

The trigger’s red pill counts **unread replies by other people** across all pages
in conversations you started or joined by replying. Replies posted before you
joined are excluded. Resolved and dismissed conversations do not contribute
notifications. **Needs your reply** opens unresolved conversations with unread
replies. Opening a conversation in the visible drawer marks its replies as
read. Read receipts persist in this browser per project and reviewer, and sync
between tabs; new replies arrive through the existing ten-second refresh. Existing
replies are unread on first use. Older comments without IDs use the reviewer’s name
for matching, so namesakes on legacy comments cannot be distinguished.

## Options

| Option               | Default                  | Purpose                                                                   |
| -------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `projectName`        | Vite root directory name | Label in the drawer                                                       |
| `storageFile`        | `.rebyu/reviews.json`    | Storage path relative to the Vite root                                    |
| `open`               | `false`                  | Open the drawer on load                                                   |
| `captureDiagnostics` | `false`                  | Record the last 20 uncaught errors / rejected promises after widget mount |
| `enabled`            | `true`                   | Disable all plugin behavior with `false`                                  |

Use a single running Vite server for each storage file. Writes are serialized within that server, saved through an atomic rename, and validated before persistence. UUIDs make creation and replies idempotent. Pin numbers are monotonically assigned and never reused after deletion. Keep `.rebyu/` in your application's `.gitignore`.

Failed new-comment submissions stay in a browser localStorage outbox, namespaced by a stable project identifier. They retry on connection recovery, every 10 seconds, and via Retry sync. Replies and status changes report failures for manual retry. Browser storage must be available for new comments; quota failures leave the form intact.

## Screenshots and privacy

Screenshots are opt-in viewport PNGs rendered from the DOM with `html-to-image`; form fields, the widget, and subtrees marked `data-rebyu-ignore` are excluded. Review text can still contain sensitive information: check the page before capture. Canvas, cross-origin images, fonts, video, and embedded frames have browser capture limitations. Captures are capped at roughly 1440 × 1080 and 3 MB. Annotations are stored as separate geometry; they are not rasterized onto the screenshot yet.

```html
<div data-rebyu-ignore>
  Do not annotate or include this subtree in screenshots
</div>
```

The API is intended for a trusted development server. Reviewer names are self-declared, and anyone with access to that server can read, reply to, resolve, or delete reviews. It has no production authentication. Cross-origin browser requests are rejected; mutations require JSON; raw storage-file requests are blocked by Vite. Do not expose it as a public feedback service.

## Workspace

The Bun `apps/*` / `packages/*` workspace layout, Moon tasks, Biome rules, Git hooks,
unused-code checks, and agent conventions are adapted from Delimoov at `cf8c799`.
The review domain is shared by both projects; package count does not imply separate domains.

- `packages/vite-plugin-rebyu`: Node plugin, file store, contracts, and isolated SolidJS widget.
- `apps/website`: the public website, disposable review demo, and development host.
- `docs/siteping-parity.md`: implemented scope, limitations, and next milestones.

[Zaidan](https://zaidan.carere.dev) primitives and Mira styles are vendored from its registry, with Shadow DOM portal and theme scoping. Rebyu defines no custom animation keyframes; CSS in `styles/reviews.css` is limited to review composition and annotation geometry. See [third-party notices](packages/vite-plugin-rebyu/THIRD_PARTY_LICENSES.md). The widget has no external font or analytics requests; the website self-hosts its fonts. The old three-page host remains a browser-test fixture.

MIT · Kevin Abatan
