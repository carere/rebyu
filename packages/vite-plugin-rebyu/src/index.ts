import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { HtmlTagDescriptor, Plugin, ResolvedConfig, UserConfig, ViteDevServer } from "vite";
import { installClientApi } from "./client-api";
import { reviewMiddleware } from "./middleware";
import type { ClientConfig } from "./schema";
import { ReviewStore } from "./store";

export type { Anchor, NewReview, Review } from "./schema";
export interface RebyuOptions {
  /** Defaults to the Vite root directory name. */
  projectName?: string;
  /** JSON storage relative to the Vite root. Defaults to .rebyu/reviews.json. */
  storageFile?: string;
  /** Start with the review drawer open. */
  open?: boolean;
  /** Opt in to collecting uncaught errors and rejected promises. */
  captureDiagnostics?: boolean;
  enabled?: boolean;
}
class RebyuPlugin implements Plugin {
  readonly name = "vite-plugin-rebyu";
  readonly apply = "serve" as const;
  private client?: ClientConfig;
  private store?: ReviewStore;
  constructor(private readonly settings: RebyuOptions) {}
  config(userConfig: UserConfig) {
    if (this.settings.enabled === false) return;
    const file = resolve(
      userConfig.root ?? process.cwd(),
      this.settings.storageFile ?? ".rebyu/reviews.json",
    );
    return {
      server: {
        fs: {
          deny: [
            ...(userConfig.server?.fs?.deny ?? [".env", ".env.*", "*.{crt,pem}", "**/.git/**"]),
            "**/.rebyu/**",
            file,
          ],
        },
      },
    };
  }
  configResolved(resolved: ResolvedConfig) {
    const prefix = `${resolved.base}__rebyu/`;
    this.store = new ReviewStore(
      resolve(resolved.root, this.settings.storageFile ?? ".rebyu/reviews.json"),
    );
    this.client = {
      projectId: createHash("sha256").update(this.store.file).digest("hex").slice(0, 16),
      projectName: this.settings.projectName ?? resolved.root.split("/").pop() ?? "My project",
      endpoint: `${prefix}reviews`,
      clientUrl: `${prefix}client.js`,
      open: this.settings.open ?? false,
      captureDiagnostics: this.settings.captureDiagnostics ?? false,
    };
  }
  transformIndexHtml(): HtmlTagDescriptor[] | undefined {
    if (this.settings.enabled === false || !this.client) return;
    const serialized = JSON.stringify(this.client).replace(/</g, "\\u003c");
    return [
      { tag: "script", children: `(${installClientApi.toString()})();`, injectTo: "head-prepend" },
      {
        tag: "script",
        attrs: { type: "module" },
        children: `import { mount } from ${JSON.stringify(this.client.clientUrl)}; mount(${serialized});`,
        injectTo: "body",
      },
    ];
  }
  configureServer(server: ViteDevServer) {
    if (this.settings.enabled === false) return;
    if (!this.client || !this.store)
      throw new Error("Rebyu must be configured before starting the server.");
    server.middlewares.use(reviewMiddleware(this.client, this.store, server.config.logger));
  }
}
/** Injects an isolated SolidJS review widget into the Vite development server. */
export default function rebyu(options: RebyuOptions = {}): Plugin {
  const plugin = new RebyuPlugin(options);
  return {
    name: plugin.name,
    apply: plugin.apply,
    config: plugin.config.bind(plugin),
    configResolved: plugin.configResolved.bind(plugin),
    transformIndexHtml: plugin.transformIndexHtml.bind(plugin),
    configureServer: plugin.configureServer.bind(plugin),
  };
}
export { rebyu };
