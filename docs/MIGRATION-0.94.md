# Migrating to Tsumikit 0.94

0.94 removes the style hooks. Components style themselves directly from the root theme tokens
and no longer read a per-component custom property: `--btn-bg`, `--badge-fs`, `--input-border`,
`--pop-trigger-pad`, `--toggle-size` and every other `--<component>-<axis>` variable is ignored,
whether it is set with `style`, on an ancestor, or in a stylesheet. Nothing fails; the override
stops applying.

Why: an element that declares a custom property stops sharing its parent's inherited variable
set, and the browser re-resolves every `var()` and `color-mix()` on it at each full-document
restyle (opening a modal dialog restyles the page). On a 1244-element page that restyle cost
86 ms with the hooks and their internal plumbing, against 18 ms with none.

The default look is unchanged: the fallback of every removed hook is now written directly.

## Find what you set

```sh
rg -n -- '--(btn|badge|txt|input|select|textarea|card|pop|toggle|opt|slider|cb|dt|md|navbar|tab|drawer|disclosure|toast|avatar|glyph-stack|radial|sortable|gauge|divider|fieldset|git-ref|callout|empty|ig|icon-size|spinner|skeleton|container|shell)-?[a-z-]*\s*:' src
```

Each hit is a declaration that no longer does anything. Replace it with one of the three below,
then delete it.

## What to use instead

1. **A token**, when the change is a theme decision. Tokens are read by every component, from
   `:root`, a `[data-theme]` block, or a container for a subtree.

   | You set | Set instead |
   |---|---|
   | `--btn-radius`, `--input-radius`, `--select-radius`, `--textarea-radius`, `--pop-trigger-radius` for every control | the radius scale: `--r-sm`, `--r-md`, `--r-lg`, `--r-pill` (and `--r-control` for segmented tracks and pill fields) |
   | `--btn-size`, `--input-size`, `--select-size`, `--textarea-size` | `--control-height-compact`, `--control-height-default`, `--control-height-large` |
   | `--pop-box`, `--btn-box` | `--box-xs`, `--box-sm`, `--box-md`, `--box-lg` |
   | `--btn-bg`, `--btn-border` for every button | `--btn-fill`, `--btn-edge`, `--btn-primary-fill` |
   | `--input-bg`, `--input-border`, `--select-*`, `--textarea-*` for every field | `--control-fill`, `--control-edge` |
   | `--toggle-accent`, `--opt-accent`, `--slider-accent`, `--btn-on` for the whole app | `--accent` (the `--c-accent` palette entry) |
   | `--txt-fg`, `--txt-size` | the text and size tokens, through `Text tone` / `size` |

2. **A prop**, when the change is per instance.

   | You set | Use |
   |---|---|
   | `--btn-tone`, `--badge-tone`, `--callout-tone`, `--empty-tone`, `--git-ref-tone` | `tone` |
   | `--toggle-accent`, `--opt-accent` | `tone` on `Toggle` and `OptionButton` (new) |
   | `--btn-size` for a tall call to action | `Button size="xl"` (new) |
   | `--badge-bg` / `--badge-fg` for a filled pill | `Badge variant="solid"` (new), with `tone` or `color` |
   | `--disclosure-pad`, `--disclosure-panel-pad` | `Disclosure flush` (new) or `size="compact"` |
   | `--drawer-body-pad: 0` | `Drawer flush` (new) |
   | `--tab-max-width` | `Tabs tabMaxWidth` (new) |
   | `--navbar-center-w`, `--navbar-center-raise` | `NavBar centerWidth` / `centerRaise` (new) |
   | `--skeleton-phase` | `Skeleton phase` (new) |
   | `--md-gap`, `--md-divider` | `MasterDetail gap` / `divider` |
   | `--radial-radius`, `--radial-petal-size` | `RadialMenu radius` / `petalSize` |
   | `--pop-trigger-*`, `--pop-box` | the trigger props on `Popover` and the pickers: `variant`, `size`, `box`, `pill`, `tone` |
   | `--cb-box`, `--toggle-size`, `--sortable-row-h` | `size` |
   | `--icon-size` on a parent | `Icon size`, or `font-size` on the parent (an icon is `1em`) |
   | `--container-gutter` | `Container gutter` |
   | `--badge-max-width`, `--git-ref-max-width` | `maxWidth` on `Badge` and `GitRef` |
   | `--card-pad`, `--card-gap`, `--card-border-style` | `Card padding` / `gap` / `border` |
   | `--divider-color`, `--divider-spacing` | `Divider tone` / `spacing` |
   | `--fieldset-pad` | `Fieldset padding` |

3. **Your own CSS, in your app**, for anything else. `class` and `style` are forwarded to the
   component's root element; write real properties, from a stylesheet you load globally (a
   consumer's scoped CSS does not reach a child component's markup).

   ```svelte
   <!-- 0.93 -->
   <Text style="--txt-size: 1.75rem">{total}</Text>

   <!-- 0.94 -->
   <Text style="font-size: 1.75rem">{total}</Text>
   ```

   A brand colour that is none of the tones is a palette decision: register a theme, or give
   the accent a scope (`.brand { --accent: var(--c-violet); }`) around the controls it applies to.
   `:global()` into kit internals (`.btn`, `.badge`, …) is still unsupported.

## Removed without a replacement

These had no consumer in the kit's own demos and now use their former default:
`--badge-fs`, `--badge-fw`, `--badge-min-size`, `--badge-radius`, `--btn-count-bg|fg|size`,
`--pop-count-bg|fg|size`, `--cb-bg|border|radius|active-bg|min-width|max-height` (Combobox),
`--dt-actions-w`, `--dt-meta-font` (DataTable meta values are always `--font-mono`),
`--drawer-max-h`, `--toast-max-width`, `--avatar-bg|fg|status-ring`, `--glyph-stack-gap|tile|zoom`,
`--radial-fab-size`, `--gauge-w|h`, `--fieldset-border`, `--textarea-mask`, `--spinner-speed`,
`--shell-header-h` (use `calc(var(--header-h) + var(--safe-top))`). Open an issue if you need one
as a prop.

## What components still set

Runtime values only, none of them an API: registered `@property` variables animated for a gradient
(`Card`, `Link`, `Spinner`), values a pseudo-element or range track reads (`Slider --pct`,
`Progress --fill`, `CapBar --cap`, the `Tabs` ink origin, the `Card` pointer spot and stack
offset, the floating-panel entry shift), and the page-layout signals, which are unchanged:
`--tabbar-h`, `--selectionbar-h`, `--section-header-h`, `--toaster-offset`,
`--toaster-offset-top`, `--sticky-offset`, `--fs-scale`.

## New props

- `Button size="xl"`.
- `Badge variant="solid"`: filled with its tone (accent when there is none).
- `Toggle tone`, `OptionButton tone`: colour of the pressed / selected tint.
- `Disclosure flush`, `Drawer flush`: drop the padding so the content lines up with its surroundings.
- `Toaster position` (`left` | `center` | `right`): which side of the `placement` edge the stack hugs.
- `NavBar centerWidth`, `centerRaise`: width of the centre notch and how far it rises above the row.
- `Tabs tabMaxWidth`: widest a tab grows before its label truncates.
- `Skeleton phase`: beats to delay a `pulse` set by, so a later set follows an earlier one.

## Looks

A look sets tokens on `:root[data-look]` and real properties on component selectors; it no longer
sets component variables. A custom look written against 0.93 that assigns `--btn-*`, `--card-*`,
`--badge-*` or `--pop-trigger-*` must write the properties themselves.
