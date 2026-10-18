# Domain docs

This repository uses a single-context layout for visual UI review.

Before exploring domain behavior, read `docs/context/root.md`, then applicable ADRs
stored directly in `docs/adr/`. Use the glossary's vocabulary in tickets, code, and tests.
Surface conflicts with accepted ADRs explicitly. Create ADRs lazily when a decision
needs recording; do not create empty context/ADR directories as a setup ritual.

The website and Vite plugin are projects within the same review domain. If multiple
business contexts emerge, migrate to `docs/context/map.md` and sibling context files,
with system ADRs under `docs/adr/root/` and context ADRs under `docs/adr/<context>/`.
Do not keep `root.md` and `map.md` as competing entry points.
