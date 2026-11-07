# Accessibility and platform features

[Back to the README](../README.md)

## Baseline

- Every interactive atom spreads `...rest`, so `id`, `aria-*`, `title`,
  `disabled` and native events pass through.
- Visible `:focus-visible` rings; ARIA patterns implemented for switch, menu
  (`role=menu` + roving focus), tabs (`tablist` + arrow keys), radiogroup,
  toolbar (`role=toolbar` + roving tabindex), dialog; polite live region for
  toasts; `.sr-only`.
- Mobile-first: one `min-width: 640px` breakpoint, bottom-sheet→centered-modal,
  safe-area insets, 16px-min inputs (no iOS zoom).
- A verified color-blind-safe theme (Okabe-Ito); meaning never relies on hue
  alone (icons + text accompany every status color).

## Built on the platform

Interactive components lean on modern web features rather than reimplementing
them in JS — less code, better a11y, fewer edge cases:

- **`<dialog>`** for Modal — top-layer rendering, real focus trap, inert
  background, focus restore and `::backdrop`, all from the browser.
- **Popover API** (`popover` / `popovertarget`) for Popover & Menu — top layer
  (no z-index races), light-dismiss and Escape handled natively; we add only
  smart placement (anchors to the trigger, flips into the viewport).
- **Native form controls** under Checkbox / RadioGroup / Select / Switch — real
  keyboard, form participation and a11y; only the visuals are tokenised.
- **`color-scheme`** per theme so native widgets/scrollbars match; **`@media
  (forced-colors)`** (Windows High Contrast) and **`prefers-contrast`** support;
  **`prefers-reduced-motion`** disables animation globally.
- **Intrinsic responsive layout**: `<AutoGrid>` (auto-fit + `minmax`) and `.cq`
  (container queries) adapt to available space, not just viewport breakpoints.
