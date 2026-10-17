/** Stable application user identity; this is attribution, not authentication. */
export interface RebyuUser {
  id: string;
  name: string;
}
export interface RebyuClientApi {
  setUser(user: RebyuUser | null): void;
  getUser(): RebyuUser | null;
}
declare global {
  interface Window {
    rebyu?: RebyuClientApi;
  }
}
/** Self-contained so the plugin can inject it synchronously before application scripts. */
export function installClientApi(): RebyuClientApi {
  if (window.rebyu) return window.rebyu;
  let user: RebyuUser | null = null;
  const api: RebyuClientApi = {
    setUser(value) {
      if (
        value !== null &&
        (!value ||
          typeof value.id !== "string" ||
          typeof value.name !== "string" ||
          !value.id.trim() ||
          value.id.trim().length > 200 ||
          !value.name.trim() ||
          value.name.trim().length > 80)
      )
        throw new TypeError(
          "Rebyu user requires an id (1–200 characters) and name (1–80 characters).",
        );
      user = value === null ? null : { id: value.id.trim(), name: value.name.trim() };
      window.dispatchEvent(new CustomEvent("rebyu:user", { detail: api.getUser() }));
    },
    getUser() {
      return user ? { ...user } : null;
    },
  };
  window.rebyu = api;
  return api;
}
