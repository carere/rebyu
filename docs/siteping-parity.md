# SitePing replacement roadmap

Baseline researched on 2026-10-16 from [SitePing](https://siteping.dev/), its [repository](https://github.com/NeosiaNexus/SitePing), and [Zaidan's drawer documentation](https://zaidan.carere.dev/docs/components/kobalte/drawer).

## Available in the initial implementation

- Framework-independent, development-only Vite plugin with a precompiled SolidJS client; no host framework or Tailwind setup required.
- Zaidan Button and a non-modal right-side Drawer, with portals inside the widget's ShadowRoot.
- Element picking, rectangle drawing, freehand drawing, numbered DOM pins, and annotation highlighting.
- CSS selector, XPath, and text fallback anchoring. Relative coordinates for drawn annotations; scroll, resize, DOM mutation, and body resize tracking.
- Cross-page review inbox with All pages / This page scope, page-path search, author filter, categories, replies, and four statuses. Selecting a review navigates to its page and reopens the conversation.
- File-backed shared comments; atomic writes, validation, serialized mutations, retry-safe creation and replies, durable new-comment outbox.
- Opt-in viewport screenshots excluding form controls and ignored subtrees. Optional uncaught error / rejected promise diagnostics.
- Light/dark themes, responsive drawer, accessible names, keyboard element selection, inbox navigation shortcuts, and reduced-motion styles.
- Three-page vanilla Vite website with eight optional seeded reviews, proving that the host application does not need SolidJS.

## Remaining before SitePing parity

1. **Anchoring and capture fidelity**: structural fingerprints / confidence scoring for reordered repeated content, nested scroll containers and layout animation tracking, annotations redrawn on screenshot, selection-area crops, screenshot redaction previews, canvas / iframe behavior, and right-click quick comments.
2. **Deployment and storage**: authenticated production server, Request/Response handler, permissions and email privacy, pluggable database stores, screenshot object storage, configurable retention and deletion, shared staging / production injection.
3. **Triage and integrations**: shareable review-link controls, custom panel actions, Slack / Discord / generic webhooks, GitHub / GitLab issue synchronization, and notifications.
4. **Reliability**: exponential backoff, queued replies and updates, explicit pending-comment cards, conflict handling, cross-tab outbox ownership, live push instead of 10-second polling, storage migrations and multi-process locking.
5. **Customization and accessibility**: locale registration and the eight SitePing locales, automatic theme matching, position and accent options, complete keyboard drawing, touch / pen and screen-reader audits. No WCAG conformance claim is made.
6. **Diagnostics**: opt-in console capture and failed HTTP request details with redaction controls. The current diagnostics only capture uncaught errors and rejected promises after initialization.
7. **Distribution**: npm publishing and release automation, CLI scaffolding / diagnostics, CI framework matrix (React, Vue, Svelte, Solid, Astro), SSR injection adapters, lazy-loaded panel and capture chunks, and bundle budgets.

The current package is a local development review tool. It does not yet replace SitePing's production service, persistence adapters, internationalization, or external integrations.
