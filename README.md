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
bun moon run playground:seed # optional: eight sample reviews, existing reviews preserved
bun moon run playground:dev
```

Open http://localhost:5173. Explore Home (`/`), Work (`/work`), and About (`/about`).
The playground is a vanilla TypeScript Vite app: the host does not need SolidJS,
Zaidan, Tailwind, or component imports. The plugin bundles its runtime and styles.
Run seed before the dev server starts so a single process owns the review file.

Moon owns project tasks and their dependency graph. Package manifests contain no
scripts. The dev task builds the plugin first; the plugin build orders its bundled
client before its Node entry. Builds declare outputs for Moon's local cache. Test
and seed tasks are not cached.

```sh
bun moon run vite-plugin-rebyu:build playground:build
bun tsc --noEmit
bun biome check . --error-on-warnings
bun knip
bun sort-package-json --check package.json 'apps/*/package.json' 'packages/*/package.json'
bun moon run vite-plugin-rebyu:test-unit vite-plugin-rebyu:test-integration
cog check --ignore-merge-commits
```

Use `bun biome check --write .` for fixes. Biome owns formatting, linting, and import
organization; Prettier is not installed. VS Code recommendations select Biome.
Lefthook sorts staged package manifests and applies Biome fixes before a commit,
then validates its Conventional Commit message using `cog verify`.

CI repeats the static checks, Moon builds, and separate unit/integration test tasks
on pull requests and pushes to main. PR metadata checks Conventional Commits, titles,
and the body template from `.agents/skills/pr/SKILL.md`. Its validator checks structure
and placeholders, not the truth of evidence. UI PRs require video evidence per the
skill. All workflows use standard GitHub runners and the pinned proto setup action;
there is no deployment configuration or project-specific remote cache.

Read [CODING_STANDARD.md](CODING_STANDARD.md) before contributing. Agent workflows
and their Rebyu-specific configuration live in [AGENTS.md](AGENTS.md),
[.agents/skills/README.md](.agents/skills/README.md), and `docs/agents/`.

## Add to a Vite project

The package has not been published. Build and pack it from this repository:

```sh
bun moon run vite-plugin-rebyu:build
cd packages/vite-plugin-rebyu
npm pack
# In your other Vite project:
npm install -D /absolute/path/to/vite-plugin-rebyu-0.1.0.tgz
```

Add it alongside your existing framework plugins:

```ts
import { defineConfig } from "vite";
import rebyu from "vite-plugin-rebyu";

export default defineConfig({
  plugins: [rebyu({ projectName: "My website" })],
});
```

This plugin uses Vite's `configureServer` and `transformIndexHtml` hooks. It runs in `vite dev`, is excluded from production builds and `vite preview`, and respects Vite's base path. Standard Vite HTML entry projects work without framework adapters. SSR frameworks with custom HTML pipelines may need an explicit injection integration; that is not implemented yet.

## Review flow

- **Select** an element with the comment tool. Keyboard users can enter select mode, Tab to a host element, and press Enter.
- **Draw** an area with the rectangle tool, or sketch with the pencil.
- Add your name, message, and a feedback / bug / idea category. Screenshots are optional.
- Click a numbered badge to locate its annotation and open the conversation.
- Reply, set Open / In progress / Resolved / Dismissed, search, or filter comments by your name. Unresolved includes Open and In progress. Resolved / dismissed pins hide unless selected.
- The drawer defaults to **All pages**. Choose **This page** to narrow the list. Each comment shows its page path; selecting a comment on another page navigates there, opens its conversation, and locates its annotation. Pins remain local to the current page.
- Export the currently filtered comments as JSON, toggle pins, or switch between light and dark themes.

`Alt+R` toggles reviews; `Esc` cancels selection and closes the drawer. `J` and `K` move through the filtered comment list outside text fields. Page identity includes pathname and query string, but excludes hash fragments.

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

Screenshots are opt-in viewport PNGs rendered from the DOM with `html-to-image`; form fields, the widget, and subtrees marked `data-rebyu-ignore` are excluded. Review text can still contain sensitive information: check the page before capture. Canvas, cross-origin images, fonts, video, and embedded frames have browser capture limitations. Captures are capped at roughly 1440 × 1080 and 3 MB. Annotations remain separate geometry in the export; they are not rasterized onto the screenshot yet.

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
- `apps/playground`: a vanilla Vite host for development and manual review testing.
- `docs/siteping-parity.md`: implemented scope, limitations, and next milestones.

[Zaidan](https://zaidan.carere.dev) Drawer and Button sources are vendored from its registry, with a local theme and Shadow DOM portal adaptation. See [third-party notices](packages/vite-plugin-rebyu/THIRD_PARTY_LICENSES.md). The widget has no external font or analytics requests; the playground loads demonstration fonts from Google Fonts.

MIT · Kevin Abatan
