import { createSignal } from "solid-js";
import type { Filter } from "./components/blocks/filters/types";
import type { ReviewScope } from "./reviews";

export function createReviewFilters() {
  const [filters, setFilters] = createSignal<Filter<string>[]>([]);
  const value = (field: string) => filters().find((filter) => filter.field === field)?.values[0];
  function setValue(field: string, value: string | undefined) {
    setFilters((previous) => {
      const remaining = previous.filter((filter) => filter.field !== field);
      return value === undefined
        ? remaining
        : [
            ...remaining,
            { id: field, field, operator: field === "search" ? "contains" : "is", values: [value] },
          ];
    });
  }
  return {
    filters,
    setFilters,
    query: () => value("search") ?? "",
    mine: () => value("author") === "me",
    scope: (): ReviewScope => (value("page") === "page" ? "page" : "all"),
    unreadOnly: () => value("replies") === "unread",
    setQuery: (query: string) => setValue("search", query || undefined),
    setMine: (mine: boolean) => setValue("author", mine ? "me" : undefined),
    setScope: (scope: ReviewScope) => setValue("page", scope === "page" ? "page" : undefined),
    setUnreadOnly: (unread: boolean) => setValue("replies", unread ? "unread" : undefined),
  };
}
