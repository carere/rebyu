# Visual UI review

Rebyu lets people leave feedback on a website in the context of the interface being
reviewed, then discuss and triage that feedback across the site's pages.

## Language

**Review**: A numbered feedback record with a message, author, page, annotation,
status, optional screenshot, browser context, and replies.

**Annotation**: The selected element, rectangle, or freehand drawing associated with
one review. Its anchor connects the geometry to the page's DOM.

**Pin**: The numbered badge on the current page that opens its review.

**Page**: A review location identified by pathname and query string. Hash fragments
are excluded from identity; review navigation uses a temporary reserved hash.

**Review drawer**: The right-side panel containing the inbox, composer, and conversation.

**Unresolved**: Reviews with Open or In progress status. Resolved and Dismissed are
separate terminal triage states; All includes every status.

**Outbox**: Browser storage that retains an unsent new review until the server accepts it.
