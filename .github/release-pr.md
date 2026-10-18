## Summary

```text
Cocogitto release
  package.json + bun.lock -> next stable version
  CHANGELOG.md -> changes since the previous release
  merge -> verify, tag the merged commit, and publish to npm
```

## Evidence

- **Before:** `main` contained unreleased Conventional Commits.
  **After:** `cog bump --auto` generated this release commit, including the package
  version, lockfile, and changelog. The preparation run is linked below. Required
  CI checks must pass before merging.

## Merge Danger

**Door:** one-way

Merging starts npm publication. Published package versions cannot be replaced.

**Blast Radius:** package

The new version becomes available to npm consumers.
