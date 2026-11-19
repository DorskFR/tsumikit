# Styling and anchoring components

[Back to the README](../README.md) · [Theming](theming.md)

## Styling a component from outside

A component has no knobs of its own. It styles itself directly from the root
theme tokens (`--accent`, `--text*`, `--surface*`, `--border*`, `--sp-*`,
`--r-*`, `--fs-*`, `--control-*`, `--box-*`, `--dur-*`, …) and reads no
per-component custom property: a `--<component>-<axis>` variable set on a
component or an ancestor does nothing (the style hooks were removed in 0.94, see
[MIGRATION-0.94.md](MIGRATION-0.94.md)). Three ways to change how something
looks, in order of preference:

- **Tokens.** A theme, a look or your own `:root` block changes every component
  at once: `--r-control` for control corners, `--font-label` for eyebrow labels,
  `--control-height-default` for the md control height, the `--c-*` palette for
  colour ([theming.md](theming.md)). A token set on a container applies to the
  subtree: `.dense { --control-height-default: 2rem; }`.
- **Props.** What varies per instance is a prop: `tone`, `variant`, `size`,
  `shape`, `box`, `pill`, `flush`, `width`, … ([components.md](components.md)).
- **Your own CSS, in your app.** `class` and `style` are forwarded to the root
  element, so layout (margin, flex, grid placement, width) is yours to set. A
  Svelte consumer's **scoped** CSS cannot reach a child component's markup — the
  scoping attribute is only added to elements the consumer itself renders — so a
  rule for a component's root goes in a stylesheet you load globally, keyed on
  your own class.

```svelte
<Button variant="primary" tone="danger" size="xl" class="ship">Ship</Button>

<div class="dense">
  <Input placeholder="Filter" />
</div>

<style>
  .dense { --control-height-default: 2rem; }
  :global(.ship) { margin-inline-start: auto; }
</style>
```

- **`:global()` into kit internals is unsupported.** Class names like `.btn`,
  `.badge`, `.select-wrap` or `.textarea` are private and change without a major
  bump. If a prop you need is missing, open an issue — do not reach in.

The custom properties a component still sets are runtime values, not an API:
registered `@property` variables animated for a gradient (`Card`, `Link`,
`Spinner`), values a pseudo-element reads (`Slider`, `Progress`, `CapBar`,
`Tabs`, `Card`, the floating panels), and the page-layout signals in the table
below. `tests/no-component-custom-properties.test.js` fails on any other.

| page-layout signal | written by | read as |
| --- | --- | --- |
| `--tabbar-h` | `TabBar`, on `<html>` | `padding-bottom: var(--tabbar-h)` on content under the bar |
| `--selectionbar-h` | `DataTable` selection bar, on `<html>` | read by `Toaster` |
| `--section-header-h` | sticky `SectionHeader`, on its parent | `top` of sibling sticky content |
| `--toaster-offset`, `--toaster-offset-top` | your app, on `:root` | extra clearance for the `Toaster` stack |
| `--sticky-offset` | your app | `top` of a sticky `SectionHeader` (default `--header-h`) |
| `--fs-scale` | the font-scale store, on `<html>` | every `--fs-*` token |

A `triggerClass` on `Popover` (or `class` on the pickers that wrap it) is a hook
for a **globally loaded** stylesheet only. Your component's *scoped* CSS cannot
reach it: Svelte's scoping attribute is added to elements your own template
renders, and the trigger belongs to `Popover`, so `.toolbar .my-trigger` compiles
to `.toolbar.svelte-x .my-trigger.svelte-x` and matches nothing. Use the
trigger's props (`variant`, `size`, `box`, `pill`, `tone`) instead.

## Anchoring to a component

Components that render a single addressable element forward rest props onto it,
so `data-journey`, `data-testid` and analytics attributes land where you expect.
`Popover` puts them on its **trigger** (so `Menu`, `ThemePicker` and
`FontScalePicker` forward through to it), `Tabs` on its root — with a per-tab
`attrs` bag on each `TabItem` — `FilterInput` on its root, and `FilterSearchBar`
forwards onto that. `Menu` items take an `attrs` bag. Components that forward
into another component take `AnchorAttributes` (`data-*` only), which cannot
collide with the child's own props; the rest take full `HTMLAttributes`. The
component's own `role`, `aria-*`, `class` and keyboard wiring are applied after
the spread and always win, so an anchor can never break behaviour; `class` in a
rest/`attrs` bag is therefore dropped — use `class` / `triggerClass`.

Never target the private `data-tsu="…"` markers: they are internal, unguarded by
any test, and change without a major.
