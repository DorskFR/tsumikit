# Layout, sizing and touch targets

[Back to the README](../README.md)

## Container queries

AppShell's `main` and `sidebar` are query containers (`container-name: main` /
`sidebar`), so components respond to **their box's** width, not the viewport.
Use the `.cq-*` utilities (`.cq-hide`, `.cq-stack`, `.cq-truncate`,
`.cq-hide-xs`) on children of any `.cq` container — e.g. wrap a button's label in
`.cq-hide` and it becomes icon-only when its column is tight. `NavItem` uses the
`sidebar` container to drop labels below ~8rem; `AppShell resizableSidebar` lets
you drag the sidebar down to that icon rail (width persisted).

AppShell exposes `--shell-header-h` (the header plus the top safe-area inset) for
sticky offsets under `viewport-fit=cover`.

## Sizing & zoom

The kit is **`rem`-based and never resets the root font-size**, so the user's
browser/OS font-size preference and browser zoom scale everything
proportionally with no code. That's the recommended path for magnification.

`fontScale` / `<FontScalePicker>` is an **opt-in** extra (drives `--fs-scale`,
text tokens only) for reading-dense apps that want larger body text while
keeping chrome compact. It isn't wired into AppShell or any default.

## Toolbar control heights

`size="sm"` is the shared compact-toolbar contract for `Button`, `Popover`
triggers, and `SegmentedControl`. Each renders an exact
`--control-height-compact` outer box, so mixed controls share a vertical center:

```svelte
<SegmentedControl size="sm" {options} bind:value />
<Popover size="sm" variant="default" label="More actions">
  {#snippet trigger()}More{/snippet}
  <!-- panel content -->
</Popover>
<Button size="sm">Apply</Button>
```

`Popover` owns that single semantic trigger button; pass `variant`, `tone`,
`size`, `control`, `block`, and `disabled` directly instead of rendering a
`Button` inside its `trigger` snippet. Without these props the trigger is a
ghost icon button. Use `control` on `Button` or `Popover` when
the roomier shared `--control-height` composer contract is required.

`variant="toggle"` renders the trigger as a `Toggle` chip — the component
itself, not a copy of its chrome — so a popover trigger sitting next to a
`Toggle` in a toolbar shares one box. `size` (`sm` default, `md`), `pill`,
`pressed` and `tone` behave as they do on `Toggle`; a `Toggle`'s height comes
from `--toggle-size`, never from its content, so an emoji, an `Icon` and text
all leave the chip the same height.

```svelte
<Toggle pressed={auto} onclick={toggleAuto}><Icon name="zap" size={12} /> Auto</Toggle>
<Popover label="Pins" variant="toggle" pressed={pinned.length > 0} count={pinned.length}>
  {#snippet trigger()}Pins{/snippet}
  {#snippet children()}…{/snippet}
</Popover>
```

`Toolbar` implements the keyboard contract its `role="toolbar"` announces: the
bar is a **single tab stop**, and `←`/`→` (plus `Home`/`End`) move between the
controls that are actually visible — collapsed `data-overflow` children drop out
of the ring and the `…` trigger is its last stop. Controls that own the arrow
keys themselves (text inputs, `select`, sliders) keep them. Pass
`roving={false}` to opt out; that drops the role along with the promise, leaving
every child an ordinary tab stop.

Button and Popover share the same semantic tones. For a confirmed positive
action, `tone="success"` gives neutral controls a success tint; combine it with
`variant="primary"` for a filled success action without consumer CSS.

`count` on `Button`, `IconButton`, `Popover` and `Menu` (their trigger) paints a corner
count pill (unread, selected, queued) on any size, variant or `box`. It hides at
`0`/`undefined`, displays `99+` past `countMax`, and the exact number joins the
accessible name (`"Inbox, 120"`) whether that comes from `aria-label`, `label`
or the button's text. The pill is accent on accent-ink, inverted on `primary`;
retint one with `--btn-count-bg` / `--btn-count-fg` (`--pop-count-*` on a
Popover). `formatCount(n, max)` / `hasCount(n)` are exported for a matching
counter elsewhere.

```svelte
<IconButton icon="bell" label="Notifications" count={unread} />
<Button variant="primary" count={selected.length} countMax={999}>Apply</Button>
<Popover label="Filters" count={active}>{#snippet trigger()}<Icon name="filter" />{/snippet}…</Popover>
```

`layout="stacked"` turns a `Button` into a hotbar slot: `glyph` (a registry
icon name, any text such as `■`, or a snippet) over the label, with heights
following `size` (sm 2.5rem, md 3rem, lg 3.625rem). `glyph` also leads an
inline button. `shortcut` paints a faint mono key hint in the top-left corner,
opposite `count`, and sets `aria-keyshortcuts`; the app still binds the key.
`tone="danger"` gives a stacked slot a danger border and ink, `pressed` sets
`aria-pressed` and an accent ring, and coarse pointers get the touch hit slab.

```svelte
<Button layout="stacked" size="sm" glyph="■" shortcut="1" tone="danger" onclick={disarm}>Disarm</Button>
<Button layout="stacked" size="sm" glyph="search" shortcut="2">Go zone</Button>
```

## Square boxes & touch targets

Icon-ish controls share one square scale, `box="xs" | "sm" | "md" | "lg"` =
`--box-xs/sm/md/lg` (1.5rem / `--control-height-compact` / 2.25rem /
`--control-height-default`): `IconButton`, `Button`, `SelectButton`, `Popover`
(trigger), `CopyButton` (hides its label) and `FileButton` (implies `iconOnly`).
A boxed control is always square, padding-less and `flex: none`, so a header
row of IconButton + SelectButton + Popover lines up with no per-app overrides.
`md` is the classic 2.25rem icon button and the default; `chip` is an outlined
`lg`. `Button square` instead takes its side from the height contract in force
(`size` tier, or `--control-height` with `control`), for a square text glyph in
a toolbar. `IconButton glyphSize` sets the exact glyph size for SVG *and* text
glyphs (`size` stays the SVG px, emoji ×1.35).

On `(pointer: coarse)` every icon-only/square control (and `Popover`'s default
trigger) carries an invisible `::after` slab that extends its hit area to
`--touch-target` (44px, WCAG 2.5.8) without moving layout; fine pointers are
untouched. The slab is the centred target with its inline-*end* half cut off:
44px tall, and the box plus half the deficit wide (34px for a 24px icon).
Inline-end overflow would count towards the scrollable overflow of every scroll
ancestor, so a button near the right edge of an `overflow-y: auto` container
would make it scroll sideways; in a row that half lies under the next sibling's
slab anyway. Growing the whole deficit towards the start instead would let each
slab cover the previous sibling's centre, so taps would land one icon to the
right.
`hitArea="compact"` opts a dense-table row out. `Button
collapseLabel="mobile" | "container"` hides `<span data-label>` children below
40rem viewport / 30rem container, drops to icon padding, and names the button
from the hidden text unless `aria-label` is set:

```svelte
<Button collapseLabel="container"><Icon name="search" /><span data-label>Search</span></Button>
<Cluster stackAt="md"><Button grow>Cancel</Button><Button grow variant="primary">Save</Button></Cluster>
```

Compact text controls (`Button size="sm"`, `Toggle`, `Switch`, `Link`) take
the same shape, sized by `--touch-slab`: at least 8px past the block edges and
the inline start, and at least `--touch-target-compact` (40px) tall, with no
inline-end overflow. `SegmentedControl` items grow on the block axis and by
half the gap sideways, which stays inside the group's padding, so neighbours
never overlap. `Input size="sm"` cannot host a pseudo-element and grows to 40px
instead, as should any control that clips its own overflow:
`min-height: var(--touch-target-compact)`.
`Checkbox`, `Button variant="link"` and the `DataTable` sort button take the same
slab; inside a DataTable it is clipped at the table's top edge. A `SegmentedControl`
wider than its container switches to the `scroll` layout until it fits again
(`wrap` wraps instead), and `block` segments ellipsise their labels.

`--control-height-*` and `--box-*` are **required tokens**: a consumer that
forks `variables.css` must keep them (Button `control`, Select `sm`, every `box`)
or those controls render with unresolved sizes.
