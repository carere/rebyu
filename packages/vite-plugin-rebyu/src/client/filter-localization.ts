import { m } from "#i18n/messages";
import { getLocale } from "#i18n/runtime";
import type { FilterI18nConfig } from "./components/blocks/filters/types";

function operators(): FilterI18nConfig["operators"] {
  return {
    is: m.review_filter_is(),
    isNot: m.review_filter_is_not(),
    isAnyOf: m.review_filter_is_any_of(),
    isNotAnyOf: m.review_filter_is_not_any_of(),
    includesAll: m.review_filter_includes_all(),
    excludesAll: m.review_filter_excludes_all(),
    before: m.review_filter_before(),
    after: m.review_filter_after(),
    between: m.review_filter_between(),
    notBetween: m.review_filter_not_between(),
    contains: m.review_filter_contains(),
    notContains: m.review_filter_not_contains(),
    startsWith: m.review_filter_starts_with(),
    endsWith: m.review_filter_ends_with(),
    isExactly: m.review_filter_is_exactly(),
    equals: m.review_filter_equals(),
    notEquals: m.review_filter_not_equals(),
    greaterThan: m.review_filter_greater_than(),
    lessThan: m.review_filter_less_than(),
    overlaps: m.review_filter_overlaps(),
    includes: m.review_filter_includes(),
    excludes: m.review_filter_excludes(),
    includesAllOf: m.review_filter_includes_all_of(),
    includesAnyOf: m.review_filter_includes_any_of(),
    empty: m.review_filter_empty(),
    notEmpty: m.review_filter_not_empty(),
  };
}

export function localizedFilters(): FilterI18nConfig {
  return {
    addFilter: m.review_filter(),
    removeFilter: m.review_filter_remove(),
    searchFields: m.review_filter_search_fields(),
    noFieldsFound: m.review_filter_no_fields(),
    noResultsFound: m.review_filter_no_results(),
    select: m.review_filter_select(),
    true: m.review_filter_true(),
    false: m.review_filter_false(),
    min: m.review_filter_min(),
    max: m.review_filter_max(),
    to: m.review_filter_to(),
    typeAndPressEnter: m.review_filter_tag_hint(),
    selected: m.review_filter_selected(),
    selectedCount: m.review_filter_selected(),
    percent: "%",
    defaultCurrency: getLocale() === "fr" ? "€" : "$",
    defaultColor: "#000000",
    addFilterTitle: m.review_filter_add_title(),
    loadingOptions: m.review_filter_loading(),
    errorLoadingOptions: m.review_filter_loading_error(),
    operators: operators(),
    placeholders: {
      enterField: (field) => m.review_filter_enter_field({ field }),
      selectField: m.review_filter_select(),
      searchField: (field) => m.review_filter_search_field({ field }),
      enterKey: m.review_filter_enter_key(),
      enterValue: m.review_filter_enter_value(),
    },
    helpers: { formatOperator: (operator) => operator.replace(/_/g, " ") },
    validation: {
      invalidEmail: m.review_filter_invalid_email(),
      invalidUrl: m.review_filter_invalid_url(),
      invalidTel: m.review_filter_invalid_tel(),
      invalid: m.review_filter_invalid(),
    },
  };
}
