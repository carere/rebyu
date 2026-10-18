# Rebyu website

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vite developers evaluating Rebyu and collaborators learning its review workflow.
The shared product truth is in `../../packages/vite-plugin-rebyu/PRODUCT.md`.

## Product Purpose

Explain how Rebyu keeps visual feedback attached to the interface, demonstrate the
mechanism, and help developers integrate the plugin into an existing Vite project.

## Operating Context

The public website targets `rebyu.carere.dev` on Cloudflare Workers. It is a private
Bun workspace with a static Vite build. The plugin remains independent of its host
framework and is excluded from production builds.

## Capabilities and Constraints

The working website proposal includes a browser-memory review example. Its notes
are illustrative, disappear on reload, and never reach the plugin's development
API. It demonstrates selecting a target, adding a note, and resolving it; it is not
the complete review widget. The original three-page host remains test-only material.

The first npm publication is still pending. Installation copy must reflect that
until the package is actually published. Do not invent users, testimonials,
benchmarks, or production collaboration capabilities.

## Brand Commitments

Use the user-selected Focus mark from `../../assets/mark.svg` and yellow icon from
`../../assets/icon.svg`. Keep the existing yellow (`#e2f276`) and ink (`#292c31`)
identity. The requested website should feel specific and useful, with clear copy
and a real product demonstration.

## Open Decisions

The user confirmed a working page first and an interactive browser-local demo,
without accounts or shared reviews. The visual direction is a working proposal.
No production deployment or Cloudflare account changes have been made.
