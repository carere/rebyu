import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installClientApi, type RebyuClientApi } from "../../../src/client-api";

let api: RebyuClientApi;
describe("Given the API bootstrap before the widget loads", () => {
  beforeEach(() => {
    vi.stubGlobal("window", new EventTarget());
    api = installClientApi();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("Then the widget reuses the identity supplied by the host application", () => {
    api.setUser({ id: " alice ", name: " Alice " });
    expect(installClientApi().getUser()).toEqual({ id: "alice", name: "Alice" });
  });
  it("Then identity updates emit events and sign-out clears the user", () => {
    const updated = vi.fn();
    window.addEventListener("rebyu:user", updated);
    api.setUser({ id: "alice", name: "Alice" });
    api.setUser(null);
    expect(updated).toHaveBeenCalledTimes(2);
    expect(api.getUser()).toBeNull();
  });
  it("Then callers cannot mutate the stored identity accidentally", () => {
    const user = { id: "alice", name: "Alice" };
    api.setUser(user);
    user.name = "Changed";
    const copy = api.getUser();
    if (copy) copy.id = "bob";
    expect(api.getUser()).toEqual({ id: "alice", name: "Alice" });
  });
  it("Then invalid identities are rejected without replacing the current user", () => {
    api.setUser({ id: "alice", name: "Alice" });
    expect(() => api.setUser({ id: "", name: "Bob" })).toThrow(TypeError);
    expect(() => api.setUser({ id: "bob", name: "x".repeat(81) })).toThrow(TypeError);
    expect(api.getUser()?.id).toBe("alice");
  });
});
