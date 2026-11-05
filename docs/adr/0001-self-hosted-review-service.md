# A user-owned review service with interchangeable storage

Rebyu runs as a separately deployable, self-hosted service rather than requiring a
Rebyu-managed cloud or sharing each reviewed application's runtime. This keeps
feedback available independently of preview teardown and lets operators choose
their persistence, screenshot storage, and authentication. A runtime-neutral HTTP
handler owns the review workflow; review and screenshot repositories are ports,
while files, S3-compatible screenshots, and the Node process are adapters. Keep
same-origin application proxies and authenticated machine access separate, with
identity and project/environment scope derived from verified server-side sessions.
Production widget injection is explicit opt-in; local development remains available.
