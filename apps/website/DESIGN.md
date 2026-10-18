---
name: Rebyu website
description: An interactive review sheet built around the Focus identity.
colors:
  brand: "#e2f276"
  ink: "#292c31"
  paper: "#fafbf7"
  muted: "#62685b"
  line: "#dfe3d8"
  focus: "#627523"
  white: "#fff"
  review-surface: "#fbfcfa"
  install-surface: "#f0f3e8"
  ink-hover: "#3d4249"
  review-outline: "#7e9236"
  input-line: "#ccd3c1"
typography:
  display:
    fontFamily: "Onest, sans-serif"
    fontSize: "clamp(52px, 5.3vw, 76px)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Onest, sans-serif"
    fontSize: "clamp(34px, 3.4vw, 46px)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Onest, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Onest, sans-serif"
    fontSize: "17px"
    lineHeight: 1.65
  action:
    fontFamily: "Onest, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  label:
    fontFamily: "Onest, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  wordmark:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    letterSpacing: "-0.035em"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    lineHeight: 1.9
rounded:
  control: "5px"
  comment: "6px"
  action: "7px"
  code: "10px"
  demo: "12px"
  pin: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  panel: "20px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  primary-link:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "16px 20px"
  primary-link-hover:
    backgroundColor: "{colors.ink-hover}"
  sample-action:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  note-submit:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  note-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  navigation:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.ink}"
    height: "80px"
  comment:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.comment}"
    padding: "{spacing.sm}"
  review-heading:
    textColor: "{colors.ink}"
    padding: "5px 8px 7px"
  sample-note:
    textColor: "{colors.ink}"
    padding: "17px 32px 16px 0"
    width: "100%"
  install-code:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.code}"
---

# Design System: Rebyu website

## Overview

**Creative North Star: "Working review sheet"**

This documents the implemented working proposal, not a final website direction
approved by the user. The approved commitments are the Focus mark, yellow and ink
identity, a code-first working page, and an interactive, disposable browser-local
example. The name above describes the current proposal rather than a separately
approved creative concept.

The current site uses broad light surfaces, close-set sans-serif headings, thin
dividers, and compact controls. Numbered pins and an adjacent conversation make
the review mechanism visible. This website system is independent of the plugin's
widget design system; the home composition remains in
[the surface brief](.impeccable/surfaces/home.md).

**Key Characteristics:**

- Approved Focus identity in yellow and ink.
- Flat light surfaces separated by tone and fine rules.
- Onest content typography with a DM Sans wordmark.
- Visible selection outlines, numbered pins, and compact note controls.

## Colors

The yellow identity sits against dark ink and light, slightly green neutrals.
Frontmatter owns the exact values; the sidecar's generated tonal ramps are preview
metadata, not additional implemented theme tokens.

### Primary

- **Focus yellow** (`brand`): identity backgrounds, numbered pins, text selection,
  and the note submission control.
- **Olive focus** (`focus`): keyboard focus outlines and the textarea caret.
- **Review olive** (`review-outline`): hovered and selected sample targets.

### Neutral

- **Ink** and **hover ink** (`ink`, `ink-hover`): primary content and dark actions.
- **Paper** (`paper`): the page background.
- **White**, **review paper**, and **installation paper** (`white`, `review-surface`,
  `install-surface`): sample content, conversation, and installation surfaces.
- **Muted olive gray** (`muted`): supporting copy, metadata, and placeholders.
- **Divider** and **field border** (`line`, `input-line`): structural separation and
  the note field boundary.

**The Focus Identity Rule.** Keep the approved Focus mark and yellow-and-ink identity.

## Typography

**Content font:** Onest, with a sans-serif fallback.
**Wordmark font:** DM Sans, with a sans-serif fallback.
**Code font:** the system monospace stack in frontmatter.

Both sans-serif families are self-hosted variable fonts with a declared weight
range of 100–900 and `font-display: swap`. Files live in `src/fonts/` with adjacent
OFL licenses. Their source is Google Fonts:
[Onest](https://github.com/google/fonts/blob/main/ofl/onest/Onest%5Bwght%5D.ttf)
and [DM Sans](https://github.com/google/fonts/blob/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf).

The hierarchy uses tight tracking and compact line heights for headings, then
smaller, looser supporting text. The frontmatter records display, headline,
conversation title, introductory body, action, label, wordmark, and code roles.
Supporting paragraphs vary by context (13–16px; line height 1.7–1.85), while demo
metadata uses 10–12px. Typical text measures are 34–39ch.

At the phone breakpoint, the display becomes `clamp(45px, 8.8vw, 62px)`, introductory
body becomes 15px, navigation becomes 12px, and the wordmark becomes 26px. The
sample heading has its own demonstration scale: `clamp(32px, 3.3vw, 46px)`, changing
to `clamp(32px, 7vw, 42px)` on phones.

## Layout

The centered content width is capped at 1240px with 56px minimum side gutters.
At 1000px and below, gutters become 32px; at 700px and below, 20px; at 370px and
below, 16px. The extracted spacing steps describe recurring values rather than a
new enforced spacing framework.

The review example keeps a flexible sample beside a 350px conversation column,
reduced to 310px at 1000px. At 700px it stacks the conversation below the sample,
replacing the side rule with a top rule. Feature and installation columns also
stack there. The navigation stays inline; the footer wraps. Main section padding
ranges from 70–88px on desktop and 44–52px on phones. The home hero's specific grid
and story order belong to its surface brief, not a global layout invariant.

## Elevation & Depth

The implemented surfaces have no shadows. White, tinted paper, 1px dividers, and
the review example's outline establish boundaries. Selection and keyboard focus
use outlines; they do not lift surfaces. The root's smooth anchor scrolling and
the dark action's 160ms background transition are the motion vocabulary. Reduced
motion switches scrolling to auto and removes transitions.

**The Flat Surface Rule.** Use tone, borders, and outlines for the current proposal's depth.

## Shapes

Controls have compact corners, with distinct radii for fields, comments, primary
actions, code panels, and the demo frame. Pins are circular (23px). The main demo
clips its contents at the frame boundary. Thin horizontal rules organize feature
rows and code sections; the sample note is an open row rather than a floating card.
The Focus artwork remains the existing SVG identity asset.

## Components

### Actions

The primary anchor uses white text on ink, a generous icon gap (36px), compact
corners, and a lighter ink hover. The sample action is a smaller dark
button (12px text, 25px icon gap) and also a review target. The note submission
button uses yellow, has a 38px minimum height, and is half-opacity while disabled.
It enables only when the note contains non-whitespace text.

All buttons, anchors, and the textarea receive a visible focus outline (2px,
offset 5px). Controls without a distinct hover treatment keep their base colors;
the sidecar does not invent extra lifts or fills.

### Navigation

The Focus mark sits beside the DM Sans wordmark. Plain inline links underline on
hover; the external GitHub link includes a small arrow. Desktop link gaps are
32px, phone gaps 16px, and narrow-phone gaps 11px. There is no collapsed menu.

### Note field and comments

The labeled textarea is white, thin-bordered, vertically resizable, and at least
70px tall. It uses muted placeholder text and an olive caret. Existing notes are
white bordered cards with 12px padding, a message, and a small muted footer with
an underlined Resolve action. The empty state is plain supporting text. The list
scrolls after 190px, or 220px on phones; resolving a note returns focus to the field.

### Review target and numbered pin

Hover and `aria-pressed="true"` apply the same fine olive outline (1.5px, offset
5px). A target with an open note gets a yellow numbered pin at its upper-right
edge. Selecting another target updates the conversation and focuses the textarea;
on phones it brings that form into view. The sample heading, action, and open note
row are the three implemented targets. Notes live only in memory and reset on reload.

**The Context Rule.** Show the selected target with an outline and attach its open-note number to the target.

### Installation panel

A white rounded panel groups small labels, plain Copy controls, and horizontally
scrollable monospace examples. Dividers separate the command, configuration, and
footnote. Syntax accents stay muted olive. The copy announces its outcome; release
status remains explicit in nearby text.

## Do's and Don'ts

### Do:

- **Do** reuse the approved Focus artwork and the yellow-and-ink identity.
- **Do** preserve visible keyboard focus and reduced-motion behavior.
- **Do** keep selection outlines and numbered pins tied to the review target.
- **Do** use the existing flat surfaces and compact control corners.

### Don't:

- **Don't** present this working proposal as a user-approved final visual direction.
- **Don't** treat the website's tokens as the plugin widget's design system.
- **Don't** add shadows or animated lifting to the current component vocabulary.
- **Don't** imply that the illustrative notes persist or are shared with other visitors.
