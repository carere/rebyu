import { beforeEach, describe, expect, it } from "vitest";
import { createReviewFilters } from "../../../src/client/review-filters";

describe("Given the review filter bar", () => {
  let state: ReturnType<typeof createReviewFilters>;
  beforeEach(() => {
    state = createReviewFilters();
  });

  it("Then it starts with unresolved comments across all pages", () => {
    expect(state.filters()).toEqual([]);
    expect(state.scope()).toBe("all");
    expect(state.mine()).toBe(false);
    expect(state.unreadOnly()).toBe(false);
  });

  describe("When filters are combined and removed", () => {
    it("Then each chip controls its criterion and removing page restores all pages", () => {
      state.setFilters([
        { id: "p", field: "page", operator: "is", values: ["page"] },
        { id: "a", field: "author", operator: "is", values: ["me"] },
        { id: "q", field: "search", operator: "contains", values: ["contrast"] },
      ]);
      expect([state.scope(), state.mine(), state.query()]).toEqual(["page", true, "contrast"]);
      state.setFilters(state.filters().filter((filter) => filter.field !== "page"));
      expect(state.scope()).toBe("all");
      expect(state.query()).toBe("contrast");
    });
  });

  describe("When a text filter has not been filled yet", () => {
    it("Then the empty chip remains editable without restricting search", () => {
      state.setFilters([{ id: "q", field: "search", operator: "contains", values: [""] }]);
      expect(state.query()).toBe("");
      expect(state.filters()).toHaveLength(1);
    });
  });

  describe("When the launcher opens unread replies", () => {
    it("Then resetting the old criteria leaves the unread filter visible in the bar", () => {
      state.setQuery("contrast");
      state.setMine(true);
      state.setScope("page");
      state.setUnreadOnly(true);
      state.setQuery("");
      state.setMine(false);
      state.setScope("all");
      expect(state.filters()).toEqual([
        { id: "replies", field: "replies", operator: "is", values: ["unread"] },
      ]);
      expect(state.unreadOnly()).toBe(true);
      state.setFilters([]);
      expect(state.unreadOnly()).toBe(false);
    });
  });
});
