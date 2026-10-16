import { createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import type { ClientConfig } from "../schema";
import { App } from "./App";
import { HOST_ID } from "./anchors";
import styles from "./styles.css?inline";
export function mount(config: ClientConfig) {
  if (document.getElementById(HOST_ID)) return;
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
    const [page, setPage] = createSignal(location.pathname + location.search);
    const interval = window.setInterval(() => setPage(location.pathname + location.search), 300);
    onCleanup(() => clearInterval(interval));
    return <App config={config} portalMount={container} page={page} errors={errors} />;
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
