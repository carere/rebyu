import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientColorMode } from "../../../src/client/components/color-mode";

let browserDocument: { cookie: string };
describe("Given Zaidan color mode scoped to Rebyu", () => {
  beforeEach(() => {
    browserDocument = { cookie: "" };
    vi.stubGlobal("document", browserDocument);
    vi.stubGlobal("window", { matchMedia: vi.fn().mockReturnValue({ matches: true }) });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("Then a saved light preference overrides a dark system preference", () => {
    browserDocument.cookie = "other=value; rebyu-color-mode=light";
    expect(getClientColorMode()).toBe("light");
  });
  it("Then a saved dark preference is restored", () => {
    browserDocument.cookie = "rebyu-color-mode=dark";
    expect(getClientColorMode()).toBe("dark");
  });
  it("Then a missing or invalid preference falls back to the system", () => {
    browserDocument.cookie = "rebyu-color-mode=invalid";
    expect(getClientColorMode()).toBe("dark");
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
    browserDocument.cookie = "";
    expect(getClientColorMode()).toBe("light");
  });
  it("Then the host's Zaidan preference stays independent", () => {
    browserDocument.cookie = "zaidan-color-mode=light";
    expect(getClientColorMode()).toBe("dark");
  });
});
