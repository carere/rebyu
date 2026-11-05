# Self-host Rebyu

Rebyu is free, open-source software deployed by its users. It requires no Rebyu
account, managed service, or external control plane. The operator owns the backend,
review storage, screenshot storage, authentication, backups, and retention.

Run the review backend independently of the reviewed application's deployments.
One instance can serve multiple authenticated project/environment scopes. Keeping
it in the application's monorepo does not require sharing its runtime or lifecycle.
Deleting a preview must not delete the service or its persistent storage.

## Run a Node service

Install `@carere/rebyu` in your service project. For unpublished changes, build and
install a tarball using the root README's packaging instructions. Use Node 24 for
the TypeScript configuration below. The CLI also accepts an explicit `.mjs` file.

Create `rebyu.config.ts` in the service project:

```ts
import { FileReviewRepository } from "@carere/rebyu/adapters/file";
import type { RebyuServerOptions } from "@carere/rebyu/node";
import { createTokenAuthenticator } from "@carere/rebyu/server";

const token = process.env.REBYU_OPERATOR_TOKEN;
if (!token) throw new Error("Set REBYU_OPERATOR_TOKEN in the service environment.");

export default {
  hostname: process.env.REBYU_HOST ?? "127.0.0.1",
  port: Number(process.env.REBYU_PORT ?? 3001),
  reviews: new FileReviewRepository("./data/reviews"),
  authenticate: createTokenAuthenticator([
    {
      token,
      session: {
        scope: { projectId: "delimoov-console", environment: "staging" },
        reviewer: { id: "operator", name: "Operator" },
        permissions: ["read", "create", "reply", "triage", "delete"],
      },
    },
  ]),
} satisfies RebyuServerOptions;
```

Generate a random token of at least 32 characters and put it in the service's
secret environment, not this file or a browser build. For example, generate one
with `openssl rand -hex 32`. Start the service with the installed `rebyu` binary:

```sh
bunx rebyu ./rebyu.config.ts
```

The default listener is loopback on port 3001. Set `REBYU_HOST=0.0.0.0` when your
container or process supervisor requires it. Put external traffic behind your own
TLS reverse proxy, request-rate limits, and authentication integration. Persist
the data directory outside ephemeral application/preview deployments. Stop the
CLI with SIGINT or SIGTERM for graceful shutdown.

The file adapter is a single-process convenience, not a multi-writer database.
Use one instance per data directory. For shared/replicated services, supply a
database adapter with transactional concurrency guarantees.

## Choose review storage

Implement `ReviewRepository`, exported from `@carere/rebyu/server`, to use your
chosen database. File and D1 adapters are bundled; no engine is forced by the core.
Every method receives `{ projectId, environment }`:

- `list(scope)` and `get(scope, id)` read only that scope and return durable state.
- `create(scope, input)` atomically returns an existing review for a repeated UUID,
  or creates an Open review with a server timestamp, empty replies, and the next pin
  number. Pin numbers are monotonic within the scope and never reused after deletion.
- `update(scope, id, patch)` atomically changes status and/or appends a reply with a
  server timestamp. Reply UUIDs make retries idempotent. Return `null` when absent.
- `remove(scope, id)` returns whether a review was deleted, without affecting other
  scopes. Identical UUIDs in different scopes are independent records.

Exported `StoredNewReview`, `StoredReview`, and `ReviewPatch` describe the contract.
Stored reviews reference `screenshotKey`; they must not store the image payload.
Enforce scope and UUID uniqueness, pin-number allocation, and reply idempotency
inside the database, not with an application-process lock. Use strongly consistent
reads for retry/reconciliation behavior. Project/environment identifiers must start
with a lowercase ASCII letter or digit and contain only lowercase letters, digits,
`_`, or `-`, up to 100 characters.

The included `FileReviewRepository` uses
`<directory>/<projectId>/<environment>/reviews.json`. Existing local-dev files are
not automatically imported into these scoped files. Preserve existing data and
plan an explicit migration rather than pointing different applications at one file.

### Cloudflare D1

Import `D1ReviewRepository` and `d1ReviewSchema` from `@carere/rebyu/adapters/d1`.
Apply the exported schema through your deployment migration tooling, then pass
`new D1ReviewRepository(env.REVIEW_DB)` as `reviews` to `createReviewHandler`.
The adapter requires no Node runtime or Cloudflare SDK. It uses a structural D1
binding interface and D1 transactions for pin allocation, scoped UUID idempotency,
and reply updates. Pin sequences survive review deletion. Keep the database in
permanent infrastructure independent of individual preview deployments.

The schema creates `rebyu_review` and `rebyu_sequence`; it does not import existing
SitePing or local JSON records. Existing data needs a deliberate migration that
also advances each scope's `last_number` to its highest imported pin number.

## Choose screenshot storage

Screenshot capture is disabled at the backend unless `screenshots` is configured.
The widget's capture checkbox remains opt-in. The backend rejects captures when
storage is disabled; configuring an object store does not trigger automatic capture.

For local disks, use `FileScreenshotRepository` from
`@carere/rebyu/adapters/file-screenshots`. For S3-compatible storage, initialize your
own SDK client and pass it to `S3ScreenshotRepository`:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { S3ScreenshotRepository } from "@carere/rebyu/adapters/s3";

const bucket = process.env.REBYU_SCREENSHOT_BUCKET;
if (!bucket) throw new Error("Set REBYU_SCREENSHOT_BUCKET.");

const screenshots = new S3ScreenshotRepository({
  client: new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  }),
  bucket,
  prefix: "rebyu",
});
```

Add `screenshots` to the server configuration. Install `@aws-sdk/client-s3` as a
direct dependency when importing it in your own configuration. The SDK client
retains control of credentials, endpoint, region, retries, and provider-specific
settings. Keep credentials in the backend environment or your SDK credential
provider; never include them in widget/Vite configuration. For R2's endpoint,
region, and Workers-specific SDK setup, consult the
[Cloudflare SDK guide](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).
The Node adapter is tested against a signed local S3 HTTP contract, not a live bucket.

Alternatively implement `ScreenshotRepository`: `put(scope, key, png)`,
`get(scope, key)`, and idempotent `remove(scope, key)`. Keys are generated UUIDs;
PNG bytes are `Uint8Array`, and missing objects return `null`. The included adapters
separate object names by project/environment and use `<key>.png`.

The API returns authenticated image routes, not public bucket URLs or expiring
signed URLs. Screenshots stay private behind the same review-read permission as
their comments. Requests are limited to 3.5 MB; screenshot data URLs to 3 million
characters. The server checks the PNG signature, not a full image decode or malware
scan. It does not rasterize annotations or provide additional redaction guarantees.

Database and object storage do not share a transaction. Duplicate submissions
preserve the winning object and remove a losing upload. An uncertain database write
retains its uploaded object rather than risk deleting a committed image; reconcile
unreferenced objects with your retention job. Deletion removes the review first,
then its image; a failed image deletion is reported through `onError`, but does not
undo the review deletion. Keep an orphan-cleanup policy and back up both stores.

## Authenticate humans and agents

`authenticate(request)` is required and returns a verified `ReviewSession` or
`null`. It must derive identity and authorized scope from validated credentials,
not unverified browser headers, the request body, or the widget's public project ID.
An exception is a backend failure, not an anonymous fallback. Rebyu replaces review
and reply authors with the authenticated reviewer.

`createTokenAuthenticator` is a small server-to-server adapter. Each token identifies
one reviewer and one authorized scope. Configure separate tokens for different
agents/scopes and rotate them in your secret configuration. Every operation requires
`read`; `create`, `reply`, `triage`, and `delete` are additional permissions. Give
agents `read`, `reply`, and `triage` without `delete` where appropriate. The example's
operator token identifies one operator; it is not multi-user browser authentication.

For browsers, reuse your application's validated session at a same-origin proxy,
or provide a custom authenticator that verifies your identity provider's assertions.
The proxy must authenticate the reviewer, verify mutation Origin/CSRF protection,
discard client-supplied identity/scope/assertion headers, and set only its own trusted
assertion. Authenticate that assertion at Rebyu. Do not expose a blanket privileged
token through an unauthenticated proxy, or send static bearer tokens to the widget.

The handler rejects an Origin different from its request URL unless it is listed
in `allowedOrigins`. When a proxy changes the upstream host or terminates TLS,
configure the exact frontend origins. This is a request-origin check, not CORS
response support or authorization. Use a same-origin proxy; direct cross-origin
browser deployment is not provided by this integration.

## Connect the reviewed application

Configure a stable public widget namespace including the project and environment.
It isolates the browser outbox and read receipts; it is not a credential or the
authority for selecting backend scope. Keep this namespace stable when a preview
is reopened and distinct from other environments.

```ts
rebyu({
  endpoint: "/__review/reviews",
  projectId: "delimoov-console:staging",
  production: true,
});
```

Set the backend's `basePath` to `/__review` and proxy that path without renaming it;
the API's relative screenshot URLs use the same path. `production: true` explicitly
includes the widget asset in builds, so enable it only in environments you intend
to review. The default remains development-only. A hosted endpoint never starts the
local review API; in development, configure Vite's proxy to reach your authenticated
backend integration. No server configuration or storage credentials enter the widget.

Without a Vite HTML integration, import `mount` from `@carere/rebyu/widget`:

```ts
import { mount } from "@carere/rebyu/widget";

const unmount = mount({
  endpoint: "/__review/reviews",
  projectId: "delimoov-console:staging",
  projectName: "Delimoov console",
});
```

Call it only in the browser after the document body exists; it installs
`window.rebyu`, mounts the isolated widget, and returns a teardown function. The
Node service also serves the precompiled module at `<basePath>/client.js` for an
explicit module-script integration. Inject it through your authenticated application
integration; an SSR-specific injection adapter is not included.

Direct mounting also accepts `initialPinsVisible: false`, `enableScreenshot: false`,
and `pageScope: "path"` when the host wants hidden initial pins, no capture controls,
and page identity without query strings. Their defaults preserve visible pins,
opt-in capture controls, and pathname-plus-query identity. These settings are also
available in the Vite plugin. An optional direct-mount `onError(error)` callback
reports API read and mutation failures to the host application.

Disable screenshot storage and set the handler's `captureDiagnostics: false` to
enforce disabled captures server-side. The latter rejects nonempty browser error
lists; the widget's `captureDiagnostics` setting independently controls collection.

## Access reviews from an agent

With the default `/__rebyu` base path, the authenticated API is:

| Method | Path | Additional permission |
| --- | --- | --- |
| GET | `/__rebyu/reviews` | None |
| GET | `/__rebyu/reviews/:id` | None |
| GET | `/__rebyu/reviews/:id/screenshot` | None |
| POST | `/__rebyu/reviews` | `create` |
| PATCH | `/__rebyu/reviews/:id` | `reply` and/or `triage`, according to the patch |
| DELETE | `/__rebyu/reviews/:id` | `delete` |

All rows require `read` and operate only in the authenticated session's scope.
Mutations with bodies require JSON. Invalid input returns 400, absent credentials
401, denied permissions/origins 403, absent records 404, unsupported methods 405,
oversized bodies 413, and incorrect content types 415. Backend failures return a
generic 500 and report details through `onError` (server logging by default).

```sh
curl --fail-with-body \
  -H "Authorization: Bearer $REBYU_AGENT_TOKEN" \
  https://your-review-service.example/__rebyu/reviews
```

An agent can reply or update `status` with PATCH without knowing whether the
operator uses files, Postgres, D1, or another adapter. Claim leases, resolution commit
history, deployment lifecycle controls, and a SitePing data migration are not yet
implemented. This is a self-hosting foundation, not a drop-in replacement for all
Delimoov-specific SitePing workflows.

## Other runtimes

`createReviewHandler` from `@carere/rebyu/server` accepts a Web `Request` and returns
a Web `Response`. It imports no Node filesystem/HTTP modules or Vite runtime. Supply
runtime-appropriate storage and authentication adapters, create one handler per
service instance, and call it from your host runtime's entrypoint. The Node CLI is
one deployment adapter, not a requirement of the review domain. The D1 adapter
accepts a native Worker binding. Native R2 binding adapters and a ready-made
Workers deployment are not included yet.
