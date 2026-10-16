# Issue tracker: GitHub

Issues and specs live in GitHub Issues in `carere/rebyu`. Use the `gh` CLI.

- Read issue bodies, labels, and comments before working on them.
- Publish one GitHub issue per approved ticket, within the user's authorized workflow.
- For multiline issue bodies and comments, write a temporary file and use `--body-file`.
- Apply triage labels using `docs/agents/triage-labels.md`.
- Represent blockers with native GitHub issue dependencies using numeric database IDs;
  if unavailable, include explicit `Blocked by` issue references.
- Work a ticket only after its blockers and maintainer review gates are satisfied.

## Pull requests as a triage surface

PRs as a request surface: no.
