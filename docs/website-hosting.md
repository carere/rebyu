# Website hosting

`apps/website` is Rebyu's public website. It builds to static assets and targets
`https://rebyu.carere.dev` on Cloudflare Workers. Its Wrangler configuration follows
the Worker/custom-domain setup in the local Zaidan repository, with static assets
in place of Zaidan's server-rendered application.

## Local commands

```sh
bun install --frozen-lockfile
bun moon run website:dev
bun moon run website:build
bun moon run website:preview
bun moon run website:deploy-check
```

`website:deploy-check` validates the production upload with Wrangler's dry run.
It does not publish or modify the domain. The public review example keeps state in
browser memory. It has no API or shared review store. The real Vite review plugin
runs during development and remains excluded from production builds and Vite preview.
Plugin browser tests use the
legacy three-page fixture in Vite test mode; website browser tests use the real
production build.

## Cloudflare configuration

Connect `carere/rebyu` through Workers Builds with the repository root as the build
root and `main` as the production branch. Configure:

- Install command: `bun install --frozen-lockfile`.
- Build command: `bun moon run website:build`.
- Deploy command: `bun moon run website:deploy`.
- Wrangler configuration: `apps/website/wrangler.jsonc`.
- Worker name: `rebyu`.
- Build variables: `BUN_VERSION=1.4.2`, `NODE_VERSION=24.21.0` (matching `.prototools`).

The deploy task builds its dependencies and runs Wrangler from `apps/website`.
Wrangler uploads `apps/website/dist` and applies the `rebyu.carere.dev` custom domain.
Use the Cloudflare account that owns the `carere.dev` zone. Authentication belongs
in the Cloudflare build environment or local Wrangler login, never in this repo.
No account ID or credentials are copied from Zaidan.

To publish manually after reviewing the build and authenticating with Cloudflare:

```sh
bun moon run website:deploy
```

Only run that command when a production deployment is intended. npm package
releases remain independent of website deployments.

The Workers static-assets configuration uses SPA fallback for direct route visits.
Cloudflare's authoritative references are [static assets](https://developers.cloudflare.com/workers/static-assets/)
and [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
