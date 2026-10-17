import { File, ListFilter, MessageCircle, Search, User } from "lucide-solid";
import { m } from "#i18n/messages";
import type { ReviewModel } from "./App";
import { Filters } from "./components/blocks/filters/filters";
import type { FilterFieldConfig } from "./components/blocks/filters/types";
import { OverlayMountContext } from "./components/overlay-mount";
import { Button, type ButtonProps } from "./components/ui/button";
import { localizedFilters } from "./filter-localization";

function fields(): FilterFieldConfig<string>[] {
  return [
    {
      key: "search",
      label: m.review_filter_text(),
      type: "text",
      icon: () => <Search />,
      operators: [{ value: "contains", label: m.review_filter_contains() }],
      defaultOperator: "contains",
      placeholder: m.review_filter_search_comments(),
    },
    {
      key: "author",
      label: m.review_filter_author(),
      type: "select",
      searchable: false,
      icon: () => <User />,
      operators: [{ value: "is", label: m.review_filter_is() }],
      options: [{ value: "me", label: m.review_filter_me() }],
    },
    {
      key: "page",
      label: m.review_filter_page(),
      type: "select",
      searchable: false,
      icon: () => <File />,
      operators: [{ value: "is", label: m.review_filter_is() }],
      options: [{ value: "page", label: m.review_filter_current_page() }],
    },
    {
      key: "replies",
      label: m.review_filter_replies(),
      type: "select",
      searchable: false,
      icon: () => <MessageCircle />,
      operators: [{ value: "is", label: m.review_filter_is() }],
      options: [{ value: "unread", label: m.review_filter_unread() }],
    },
  ];
}

function AddFilterTrigger(props: ButtonProps) {
  return (
    <Button variant="outline" size="lg" {...props}>
      <ListFilter /> {m.review_filter()}
    </Button>
  );
}

export function ReviewFilters(props: { model: ReviewModel }) {
  return (
    <OverlayMountContext.Provider value={props.model.props.portalMount}>
      <Filters<string>
        trigger={AddFilterTrigger}
        fields={fields()}
        i18n={localizedFilters()}
        filters={props.model.filters()}
        onChange={props.model.setFilters}
        allowMultiple={false}
        showSearchInput={false}
        size="lg"
        class="review-filters"
      />
    </OverlayMountContext.Provider>
  );
}
