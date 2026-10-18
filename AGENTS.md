# AGENTS.md

Before writing or reviewing code and tests, read [CODING_STANDARD.md](CODING_STANDARD.md)
and the contributor commands in [README.md](README.md).

## Workspace

Use Bun workspaces and Moon for project tasks. Run `bun biome`, `bun tsc --noEmit`,
`bun knip`, `bun sort-package-json --check ...`, and Cocogitto directly at the root.
Use `bun moon run website:dev` for development; the task builds its plugin dependency.
Do not add package scripts or a second formatter/linter. Keep the plugin independent
of the host framework and mount its Zaidan portals inside the widget ShadowRoot.

## Agent skills

Use the committed skills in `.agents/skills/`; see its README for provenance and
upstream-update rules. `/ask-matt` routes to the engineering workflows. The
`setup-matt-pocock-skills` repository configuration is already in place.

### Issue tracker

Use GitHub Issues in `carere/rebyu`. Before issue operations,
read [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Use the five canonical triage labels. Before triaging or labeling issues,
read [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Rebyu has one review domain. Before exploring domain behavior,
read [docs/agents/domain.md](docs/agents/domain.md), then `docs/context/root.md`.
Do not infer additional bounded contexts from the number of workspace projects.

## Pull requests

Use Conventional Commit messages and PR titles. The committed `pr` skill defines
Summary / Evidence / Merge Danger; CI reads its template directly. Include playable
video evidence for UI behavior changes as specified by that skill. Do not publish
issues, comments, releases, or deployments solely because a skill is installed;
follow the user's authorized workflow.
