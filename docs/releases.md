# npm releases

Rebyu publishes one package, `vite-plugin-rebyu`. The workspace root and website
stay private. Cocogitto owns the stable version, release commit, `vMAJOR.MINOR.PATCH`
tag, and root `CHANGELOG.md`. Its pre-bump hooks update the plugin manifest and
`bun.lock`. All repository commits contribute to the changelog; there is no separate
version for the website. Prerelease publishing is not configured yet.

The **Release to npm** workflow (`.github/workflows/publish.yml`) handles subsequent
releases in GitHub Actions. You start it manually on `main`; it runs Cocogitto and
opens a release PR containing the version, lockfile, and changelog updates. Merging
that PR starts a new run which tags the merged commit, verifies it, and publishes
it. This respects the repository's required-PR rules for `main`.

The workflow also accepts pushed version tags for the first release and recovery.
Pushing ordinary changes to `main` runs CI without releasing.

Before publishing, the workflow verifies that the release commit belongs to `main`
and its package version matches the tag. It runs static checks, builds, unit,
integration, and browser tests, then previews the package and publishes it to the
public npm registry. The pinned Node toolchain includes npm 11.5.1 or later,
as required by [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
Publishing uses GitHub OIDC (`id-token: write`); no `NPM_TOKEN` secret is needed.
npm automatically adds provenance when trusted publishing from a public repository.

## First release

First merge the release setup into `main`. The package must exist on npm before
its trusted publisher can be configured. A maintainer with the intended npm account
must perform this initial publish; these commands publish a real public package.

From a clean, up-to-date `main`, with the toolchain from the root README installed:

```sh
git switch main
git pull --ff-only
bun install --frozen-lockfile
cog bump --version 0.1.0
bun moon run vite-plugin-rebyu:build website:build
bun tsc --noEmit
bun biome check . --error-on-warnings
bun knip
bun sort-package-json --check package.json 'apps/*/package.json' 'packages/*/package.json'
bun moon run vite-plugin-rebyu:test-unit vite-plugin-rebyu:test-integration
# Install Chromium as described in README.md if needed.
bun moon run vite-plugin-rebyu:test-browser
npm login
cd packages/vite-plugin-rebyu
npm pack --dry-run
npm publish --access public
cd ../..
```

Review the package contents before publishing. The manifest's `files` allowlist
ships `dist/` and `THIRD_PARTY_LICENSES.md`; npm also includes the package README,
manifest, and MIT license. The bundled client must be present under `dist/client/`.

Open `vite-plugin-rebyu` → Settings → Trusted publishing on npmjs.com and add:

- Provider: GitHub Actions.
- Organization or user: `carere`.
- Repository: `rebyu`.
- Workflow filename: `publish.yml` (no directory prefix).
- Environment name: leave empty; the workflow does not use a GitHub environment.
- Allowed actions: enable direct publishing with `npm publish`.

Then review the release commit, changelog, manifest, and lockfile, and push them:

```sh
git show --stat HEAD
git push --atomic origin main refs/tags/v0.1.0
```

The workflow validates this first tag but skips publishing the version that was
already published manually. Newly configured trusted publishers must complete a
successful CI publish within two days. Create the configuration when the next
release is ready, or recreate it if it expires before that release.

## Subsequent releases

No local commands are needed after the first release:

1. Merge the intended changes into `main` and wait for CI to pass.
2. Open the repository's **Actions** tab and select **Release to npm**.
3. Click **Run workflow**, select branch **main**, and start the run.
4. The **Prepare the release** job runs `cog bump --auto` and opens a
   `chore(release): vX.Y.Z` PR from `release/vX.Y.Z` with the manifest, lockfile,
   and changelog updates. Its local Cocogitto tag is not pushed.
5. Review and merge that PR when its required checks pass. If GitHub requests
   approval to run CI for this bot-created PR, approve the workflows in the PR UI.
6. The merged-PR event triggers the workflow again. It validates the version,
   creates the tag on the exact merged commit, runs all checks and tests, and
   publishes the new version using npm OIDC.

[Cocogitto](https://docs.cocogitto.io/guide/bump.html) chooses versions from
Conventional Commits: fixes increment patch, features increment minor, and breaking
changes increment major. If no version-affecting commits exist since the last
release, the workflow finishes without opening a PR or publishing anything. Merge
or close an existing release PR before starting another release. Prepare releases
once their intended changes are on `main`; merge the release PR before adding more
changes intended for a later release.

During initial setup, enable **Settings → Actions → General → Workflow permissions
→ Allow GitHub Actions to create and approve pull requests**. The repository
currently disables this setting. Leave the default workflow permissions read-only;
this workflow grants `contents: write` and `pull-requests: write` only to preparation,
and `contents: write` plus `id-token: write` to publishing (which creates the tag).
No GitHub App or personal access token is required. The workflow does not modify
branch protection and does not merge its own PRs.

[GitHub does not trigger push workflows for pushes made with
`GITHUB_TOKEN`](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
The human merge starts the publishing run; it creates the tag and publishes within
that run rather than relying on another tag-push event. All release runs share one
concurrency group.

## Failed releases

If the merged release's publishing run fails, fix external prerequisites and
choose **Re-run failed jobs** on that run. The successful preparation job's outputs
are reused, so publishing retries the same commit and tag without bumping again.
An already published version still passes through verification but skips the npm
publish command.

A source fix needs a new commit: merge the fix into `main`, start a fresh release
run, then merge its release PR. The failed attempt's tag remains, so Cocogitto
creates the next version. After publication, never reuse a version for different
contents.

If PR creation fails after its branch was pushed (for example, because Actions
PR creation was disabled), enable the setting above, delete the unmerged
`release/vX.Y.Z` branch in GitHub, and run preparation again. These recovery steps
also require no local commands.

Authentication failures usually mean the trusted publisher fields do not match,
direct `npm publish` was not allowed, or the configuration expired. Check the npm
settings against the values above. Do not add a token to work around OIDC setup.
