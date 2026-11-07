# Styling and anchoring components

[Back to the README](../README.md) · [Theming](theming.md)

## Styling a component from outside

A Svelte consumer's **scoped** CSS cannot reach a child component's markup — the
scoping attribute is only added to elements the consumer itself renders. `class`
passthrough therefore only helps for layout hooks (margin, flex, grid placement).
CSS custom properties *do* cross the component boundary, so they are the
sanctioned escape hatch for everything else.

- **Naming:** `--<prefix>-<axis>`, where `<prefix>` is the component's short
  prefix (`btn`, `badge`, `txt`, `select`, `input`, `textarea`, `card`, `md`, …)
  and `<axis>` is one of `bg`, `fg`, `border`, `size`, `radius`, plus a few
  component-specific ones (`--btn-tone`, `--badge-max-width`, `--gauge-w`).
  `Text` uses `txt` because `--text*` is already the theme's foreground token.
- **Setting them:** per instance via `style`, or on any ancestor for a subtree.

```svelte
<Button style="--btn-bg: var(--c-violet); --btn-fg: #fff; --btn-radius: 0">Ship</Button>

<div class="danger-zone">
  <Button>Delete</Button>   <!-- inherits the block below -->
</div>

<style>
  .danger-zone { --btn-border: var(--danger); --btn-fg: var(--danger); }
</style>
```

- Every property is read as `var(--x, <default>)`, so leaving it unset renders
  the default look.
- **`:global()` into kit internals is unsupported.** Class names like `.btn`,
  `.badge`, `.select-wrap` or `.textarea` are private and change without a major
  bump. If an axis you need is missing, open an issue — do not reach in.

| component | published properties |
| --- | --- |
| `Button` | `--btn-bg`, `--btn-fg`, `--btn-border`, `--btn-size`, `--btn-radius`, `--btn-tone`, `--btn-on`, `--btn-box`, `--btn-count-bg`, `--btn-count-fg`, `--btn-count-size` |
| `Badge` | `--badge-bg`, `--badge-fg`, `--badge-border`, `--badge-radius`, `--badge-tone`, `--badge-max-width`, `--badge-fs`, `--badge-fw`, `--badge-min-size` |
| `Text` | `--txt-fg`, `--txt-size` |
| `Tabs` | `--tab-max-width` |
| `Select` | `--select-bg`, `--select-fg`, `--select-border`, `--select-size`, `--select-radius` |
| `Input` | `--input-bg`, `--input-fg`, `--input-border`, `--input-size`, `--input-radius` |
| `Textarea` | `--textarea-bg`, `--textarea-fg`, `--textarea-border`, `--textarea-size`, `--textarea-radius` |
| `Card` | `--card-pad`, `--card-gap`, `--card-border-style` |
| `Divider` | `--divider-color`, `--divider-spacing` |
| `Gauge` | `--gauge-w`, `--gauge-h`, `--gauge-fill` |
| `MasterDetail` | `--md-list-w`, `--md-gap`, `--md-divider` |
| `NavBar` | `--navbar-max`, `--navbar-center-w`, `--navbar-center-raise` |
| `Callout` | `--callout-tone` |
| `Fieldset` | `--fieldset-pad`, `--fieldset-border` |
| `GitRef` | `--git-ref-tone`, `--git-ref-max-width` |
| `EmptyState` | `--empty-tone` |
| `Combobox` | `--cb-bg`, `--cb-border`, `--cb-radius`, `--cb-active-bg`, `--cb-min-width`, `--cb-max-height` |
| `Toggle` | `--toggle-accent`, `--toggle-size` |
| `Popover` | `--pop-trigger-bg`, `--pop-trigger-fg`, `--pop-trigger-border`, `--pop-trigger-radius`, `--pop-trigger-size`, `--pop-trigger-pad`, `--pop-box`, `--pop-count-bg`, `--pop-count-fg`, `--pop-count-size` |
| `SortableList` | `--sortable-row-h` |
| `RadialMenu` | `--radial-radius`, `--radial-petal-size`, `--radial-fab-size` |

`tests/css-custom-property-contract.test.js` reads this table and fails if a
listed property is not actually read by its component, so the docs cannot drift.

`Popover`'s hooks paint the **trigger**; hover states keep their own feedback
colours. `--pop-box: auto` releases the square floor, so `pill` plus
`--pop-trigger-pad` reshapes the default trigger into a chip of any height. `--pop-trigger-border` needs the chromed trigger — `bare` means no ring
by definition. `Badge`'s `--badge-min-size` pairs with `numeric` (already centred
and tabular) to turn a count badge into a square/circular counter.

A `triggerClass` on `Popover` (or `class` on the pickers that wrap it) is a hook
for a **globally loaded** stylesheet only. Your component's *scoped* CSS cannot
reach it: Svelte's scoping attribute is added to elements your own template
renders, and the trigger belongs to `Popover`, so `.toolbar .my-trigger` compiles
to `.toolbar.svelte-x .my-trigger.svelte-x` and matches nothing. Use `style` and
the properties above instead.

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
