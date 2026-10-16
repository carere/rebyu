# Coding standard

Adapted from Delimoov at `cf8c799826882c7030f1c0aecef0e26a28200f93`.

## Language and boundaries

- Use TypeScript for application code, tests, scripts, and supported tool configuration.
  Generated JavaScript is a build artifact, not source. Moon and GitHub Actions use YAML.
- Rebyu has one review domain; read `docs/context/root.md` for its vocabulary.
  Keep domain boundaries inside projects; do not create packages for each concept.
- The plugin owns its HTTP API, persistence, annotation behavior, and isolated widget.
  The playground is a consumer and demonstration surface, not production plugin logic.
- Current small-project layout: Node integration lives in the plugin's `src/`, the
  widget in `src/client/`, and vendored Zaidan primitives in `src/client/components/ui/`.
  Keep rendering, browser event handling, HTTP routing, and persistence in separate modules.
- As domain behavior grows, organize it under `src/contexts/review/<concept>` and put
  genuinely shared technical code under `src/contexts/shared/<concept>`. Keep styles,
  route entry points, and localization outside context folders. Move related files
  together when changing their boundary; do not leave duplicate implementations.
- Use ports and adapters when adding interchangeable persistence, capture, or transport
  implementations. Use `Repository` for data access and `Service` for other capabilities;
  adapters identify their implementation, such as `FileReviewRepository`.
- Use neighboring relative imports and workspace package names across projects. For
  deeper project-local aliases, use `package.json` subpath imports (`#...`); do not
  duplicate mappings in TypeScript paths or Vite aliases. Avoid barrel files, apart
  from the package's explicit public export surface.
- The playground seed script intentionally uses the source file store to prepare local
  fixtures before the dev server starts. Do not expose that helper in the published API.

## Frontend components

- Check the installed Zaidan primitives before adding custom controls. Compose primitives
  when necessary. Preserve upstream notices and document local changes in
  `THIRD_PARTY_LICENSES.md`; do not silently replace them with another design system.
- For native-element wrappers, derive props with Solid's `ComponentProps`, use
  `splitProps`, merge classes with `cn(defaults, local.class)`, spread native attributes,
  and preserve caller-controlled children. Keep access to Solid props reactive.
- Accessor functions in the widget's stable model may be passed between views. Do not
  destructure reactive values from a changing Solid props object into plain snapshots.
- Keep effects and event listeners scoped to the owning component and clean them up.
  Use visible loading/error states. A failed submission must not silently lose a comment.
- Keep styles and portals inside the ShadowRoot. Host applications must not need SolidJS,
  Tailwind, or Zaidan configuration. Production builds exclude the development widget.
- Name buttons and inputs accessibly, specify button types, support keyboard interaction,
  and respect reduced motion. Use the T3 collaborative browser when available; write
  Playwright tests for critical UI flows as browser automation coverage grows.

## Testing

- Group conditions under `describe("Given ...")`, additional conditions under `And ...`,
  actions under `When ...`, and observable outcomes under `it("Then ...")`.
  Use only the nesting needed for the scenario. Existing suites can be migrated when
  their behavior changes, rather than rewriting tests solely to rename them.
- Initialize fresh mutable state in lifecycle hooks; do not perform setup during suite
  registration. The suite that owns a resource owns its cleanup.
- Keep unit tests independent of real infrastructure. Integration tests exercise real
  adapters and API boundaries. Keep their Moon tasks separate.
- Tests live inside the owning project's `tests/unit`, `tests/integration`, and
  `tests/support` folders, mirroring source ownership. Do not colocate test files in `src/`.
  Moon tasks discover all tests inside their unit or integration folder.
- In-memory test adapters return configurable values. Do not duplicate a production
  adapter's maps, indexing, or persistence logic in a test double.
- Test exported behavior, including persistence, retries, navigation, privacy boundaries,
  and production exclusion. Avoid tests that merely mirror an implementation.

## Workspace tooling

- Use Bun workspaces and Moon for builds, development, previews, seed utilities, and tests.
  Do not add package scripts. Keep dependency ordering and outputs explicit in Moon.
- Run repository-wide TypeScript, Biome, Knip, package-sort, and Cocogitto checks directly.
  The root TypeScript configuration is intentionally a no-emit check for this two-project
  workspace; it does not yet need Delimoov's declaration-reference build graph.
- Biome replaces Prettier and owns formatting, linting, and import organization.
  Use two spaces and a 100-column line width. Enforce 500-line source files and 60-line
  logic functions. Solid TSX composition/render functions have a 300-line limit because
  their declarative layout and reactive wiring are counted as function lines; split
  views by responsibility rather than hiding logic in JSX to meet a line count.
- Explain necessary suppressions locally. Stylesheet specificity suppressions apply
  only to component-organized selectors; reduced-motion overrides retain `!important`.
- Use Conventional Commits for commits and PR titles. Lefthook sorts staged manifests,
  applies Biome fixes, and checks commit messages with Cocogitto. Never bypass hooks
  merely to make a change land.
- Follow the installed `pr` skill for PR bodies and evidence. CI validates its template,
  commit/title format, static checks, build outputs, and separate test tasks.
- Keep tool versions, `.prototools`, `packageManager`, and `bun.lock` aligned. Do not copy
  another project's remote cache credentials, deployment setup, or environment secrets.
