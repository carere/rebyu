# Rebyu

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers and collaborators reviewing the interface of a Vite project. Reviewers
point out details on the running website, discuss them, and track changes across
its pages. Developers integrate the tool into their existing application.

## Product Purpose

Keep UI feedback attached to the interface it concerns. Reviewers can select an
element or draw an annotation, leave a numbered comment, and continue the
conversation without losing its page context. Success means feedback is easy to
place, find, discuss, and resolve.

## Operating Context

Rebyu is a Vite plugin with a bundled SolidJS widget. It works independently of the
host application's frontend framework and requires no host UI or stylesheet setup.
The current release targets trusted development servers and excludes the widget
and API from production builds and Vite preview.

The website in `../../apps/website` explains integration and contains a browser-local
review example. Its `tests/fixtures` folder retains a three-page host for regression
testing the real widget. The website is a consumer, not production plugin logic.

## Capabilities and Constraints

- Annotate by selecting an element, drawing a rectangle, or drawing freehand.
- Numbered pins connect comments to locations on the current page and track scrolling.
- A right-side review drawer lists comments across all pages by default. Reviewers
  can filter to the current page and navigate to a comment on another page.
- The widget supports English and French, with a persisted language choice that
  preserves unfinished comments and leaves the reviewed site's locale unchanged.
- Reviews support replies, categories, search, author filters, and resolving
  comments. Resolved comments disappear from the inbox and page pins.
- The bottom-right launcher exposes pin visibility, annotation tools, the review
  list, and conversations with unread replies. Its badge counts other people's
  unread replies in conversations the reviewer started or joined.
- The developer can identify the reviewer through `window.rebyu.setUser`. This
  fills the name field and attributes submissions; it does not authenticate users.
- Comments persist in a project-local JSON file. Failed new submissions remain in
  a browser outbox. Read receipts are local to the browser and reviewer.
- Screenshots and uncaught-error diagnostics are opt-in.
- Use Zaidan primitives, installed through its CLI, wherever available. Keep
  default primitive animations; custom composition and branding belong in
  Rebyu-owned files. Portals and light/dark themes stay inside the widget Shadow DOM.
- Full keyboard drawing, production authentication, shared production hosting,
  external integrations, and broader distribution remain future work. Do not
  present them as available capabilities.

## Brand Commitments

The product name is Rebyu. Keep controls compact and their purpose understandable;
use explanatory tooltips for launcher icons. Avoid decorative copy that consumes
space without helping a reviewer act.

## Evidence on Hand

- `README.md` documents package integration and current behavior.
- `../../docs/context/root.md` defines review-domain terminology.
- `../../apps/website` contains the public site, a browser-local example, and
  three-page browser-test fixtures. Example reviews are not customer evidence.
- `../../assets/icon.svg` is the existing repository icon.
- `THIRD_PARTY_LICENSES.md` records Zaidan provenance and integration adaptations.

## Product Principles

1. Keep feedback connected to the interface and conversation it concerns.
2. Make reviews discoverable across pages while keeping page pins local.
3. Fit into the developer's existing Vite project without changing its framework
   or theme.
4. Keep the review controls compact, clear, and focused on useful actions.
5. Preserve unsent feedback and make submission failures visible.

## Open Decisions

The public website targets Cloudflare Workers at `rebyu.carere.dev`. Production
hosting for the review plugin itself, authentication, and integrations remain open. No WCAG conformance level has been established.
