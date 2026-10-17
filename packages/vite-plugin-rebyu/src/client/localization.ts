import { createSignal } from "solid-js";
import {
  baseLocale,
  getLocale,
  isLocale,
  type Locale,
  overwriteGetLocale,
  setLocale,
} from "#i18n/runtime";

const [locale, setCurrentLocale] = createSignal<Locale>(baseLocale);

export function initializeLocale() {
  setCurrentLocale(getLocale());
  // Only this client-rendered widget owns this runtime. Reading the signal makes
  // generated message calls reactive without recreating forms or touching the host.
  overwriteGetLocale(locale);
}

export async function changeLocale(value: string) {
  if (!isLocale(value)) return;
  await setLocale(value, { reload: false });
  setCurrentLocale(value);
}

export { locale };
