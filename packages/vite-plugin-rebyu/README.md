# vite-plugin-rebyu

Visual reviews on your Vite development server, powered by SolidJS and [Zaidan](https://zaidan.carere.dev).

```ts
import { defineConfig } from "vite";
import rebyu from "vite-plugin-rebyu";

export default defineConfig({
  plugins: [rebyu({ projectName: "My website" })],
});
```

No framework imports or styles are required in your app. The widget bundles its own runtime, renders inside a Shadow DOM, and uses a right-side review drawer. Select elements, draw rectangles or freehand sketches, leave numbered comments, reply, change statuses, and export filtered reviews. The drawer lists comments from all pages by default; select This page to narrow the list. Selecting a comment from another page navigates to its annotation. Screenshots and uncaught error diagnostics are opt-in.

Comments persist in `.rebyu/reviews.json` relative to your Vite root. Add `.rebyu/` to `.gitignore`. Requires a standard Vite HTML pipeline. The plugin runs only in development and is excluded from production builds and `vite preview`.

Options: `projectName`, `storageFile`, `open` (false), `captureDiagnostics` (false), and `enabled` (true).

This is an initial implementation for trusted development servers, with self-declared reviewer names and no production authentication. Full setup, limitations, and the SitePing parity roadmap are in the [repository](https://github.com/carere/rebyu).

MIT · Kevin Abatan. Vendored Zaidan sources retain their MIT notices in THIRD_PARTY_LICENSES.md.
