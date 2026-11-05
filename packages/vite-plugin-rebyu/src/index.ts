import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
  endpoint?: string;
  projectId?: string;
  production?: boolean;
  /** Start with the review drawer open. */
  open?: boolean;
  /** Opt in to collecting uncaught errors and rejected promises. */
  captureDiagnostics?: boolean;
  initialPinsVisible?: boolean;
  enableScreenshot?: boolean;
  pageScope?: "path" | "path-and-query";
  enabled?: boolean;
}
class RebyuPlugin implements Plugin {
  readonly name = "vite-plugin-rebyu";
  readonly apply: "serve" | undefined;
  private client?: ClientConfig;
  private store?: ReviewStore;
  private assetFile?: string;
  constructor(private readonly settings: RebyuOptions) {
    this.apply = settings.production ? undefined : "serve";
    if (settings.enabled === false) return;
    if (settings.production && (!settings.endpoint || !settings.projectId))
      throw new Error(
        "Production review injection requires a hosted endpoint and stable projectId.",
      );
    if (settings.endpoint && !settings.projectId)
      throw new Error("A hosted review endpoint requires a stable projectId for browser storage.");
    if (settings.endpoint && !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(settings.endpoint))
      throw new Error("Use a same-origin review endpoint path without a trailing slash.");
  }
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
    const file = resolve(resolved.root, this.settings.storageFile ?? ".rebyu/reviews.json");
    if (!this.settings.endpoint) this.store = new ReviewStore(file);
    const clientUrl =
      resolved.command === "build"
        ? `${resolved.base}${resolved.build.assetsDir}/rebyu-client.js`
        : `${prefix}client.js`;
    this.assetFile = `${resolved.build.assetsDir}/rebyu-client.js`;
    this.client = {
      projectId:
        this.settings.projectId ?? createHash("sha256").update(file).digest("hex").slice(0, 16),
      projectName: this.settings.projectName ?? resolved.root.split("/").pop() ?? "My project",
      endpoint: this.settings.endpoint ?? `${prefix}reviews`,
      clientUrl,
      open: this.settings.open ?? false,
      captureDiagnostics: this.settings.captureDiagnostics ?? false,
      initialPinsVisible: this.settings.initialPinsVisible ?? true,
      enableScreenshot: this.settings.enableScreenshot ?? true,
      pageScope: this.settings.pageScope ?? "path-and-query",
    };
  }
  async productionAsset() {
    if (this.settings.enabled === false || !this.settings.production || !this.client) return;
    const source = await readFile(new URL("./client/client.js", import.meta.url));
    return { type: "asset" as const, fileName: this.assetFile, source };
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
    if (!this.client) throw new Error("Rebyu must be configured before starting the server.");
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
    async generateBundle() {
      const asset = await plugin.productionAsset();
      if (asset) this.emitFile(asset);
    },
  };
}
export { rebyu };
