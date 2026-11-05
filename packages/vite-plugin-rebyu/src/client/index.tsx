import { createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { getTextDirection } from "#i18n/runtime";
import { installClientApi } from "../client-api";
import type { ClientConfig, WidgetOptions } from "../schema";
import { App } from "./App";
import { HOST_ID } from "./anchors";
import { ColorModeProvider, getClientColorMode } from "./components/color-mode";
import { initializeLocale, locale } from "./localization";
import styles from "./styles.css?inline";
export function mount(options: WidgetOptions) {
  if (document.getElementById(HOST_ID)) return;
  installClientApi();
  const config: ClientConfig = {
    projectName: options.projectId,
    clientUrl: "",
    open: false,
    captureDiagnostics: false,
    initialPinsVisible: true,
    enableScreenshot: true,
    pageScope: "path-and-query",
    ...options,
  };
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
  document.body.append(host);
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  root.append(style);
  const container = document.createElement("div");
  container.className = "rebyu-root";
  root.append(container);
  const errors: string[] = [];
  const record = (message: string) => {
    errors.push(message.slice(0, 1000));
    if (errors.length > 20) errors.shift();
  };
  const onError = (event: ErrorEvent) => record(event.message);
  const onRejection = (event: PromiseRejectionEvent) => record(String(event.reason));
  if (config.captureDiagnostics) {
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
  }
  const dispose = render(() => {
    initializeLocale();
    createEffect(() => {
      container.lang = locale();
      container.dir = getTextDirection(locale());
    });
    const pagePath = () => location.pathname + (config.pageScope === "path" ? "" : location.search);
    const [page, setPage] = createSignal(pagePath());
    const interval = window.setInterval(() => setPage(pagePath()), 300);
    onCleanup(() => clearInterval(interval));
    return (
      <ColorModeProvider initialColorMode={getClientColorMode()} target={container}>
        <App config={config} portalMount={container} page={page} errors={errors} />
      </ColorModeProvider>
    );
  }, container);
  const teardown = () => {
    dispose();
    host.remove();
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
  window.addEventListener("pagehide", teardown, { once: true });
  return teardown;
}
