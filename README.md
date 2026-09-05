# @dorsk/tsumikit

A minimal, **dependency-free** UI kit for Svelte 5 + pure CSS. Token-driven
atoms and molecules with theming, font-scaling, a color-blind-safe theme and
mobile/a11y baked in. No CDNs, no runtime UI dependencies — just Svelte 5 as a
peer.

## Design

Each layer reaches only one layer down:

```
variables.css  →  every color/space/radius/font/size is a var(--…). No
                  component hard-codes a hex or a pixel.
      ↓
atoms          →  the only place raw <button>/<input>/<select>/<h*>/text lives.
      ↓
molecules      →  compose or specialize atoms (never reimplement a primitive).
      ↓
your app       →  assemble molecules + layout.
```

**Rules:** primitives live in atoms only · specialize, don't reimplement · no
hard-coded values · override by specificity, never by forking · props (incl.
`aria-*`) spread down onto the underlying element.

**Live demo:** https://dorskfr.github.io/tsumikit

## Develop

```bash
npm install
npm run dev      # showcase at the printed URL (+ /shell for the AppShell demo)
npm run lint     # biome (ts/js)
npm run check    # svelte-check
npm run build    # prerendered static site in /build
npm run package  # build the publishable library into /dist (+ publint)
```

Git hooks (Biome on commit, `svelte-check` on push) are installed by lefthook
via the `prepare` script. The library is published to npm from a release tag
via GitHub Actions using npm **trusted publishing** (OIDC — no token secret).

## Use in your own project

```ts
import '@dorsk/tsumikit/styles/app.css';            // once, at the app root
import { Button, Field, Input, Modal, ThemePicker } from '@dorsk/tsumikit';
```

```svelte
<Field label="Name" for="name">
  <Input id="name" bind:value={name} />
</Field>
<Button variant="primary" onclick={save}>Save</Button>
```

## Theming

- 23 themes ship (light, highcontrast, gruvboxlight, solarizedlight,
  everforestlight, rosepinedawn, latte, nordlight, tokyoday, kanagawalotus,
  sepia, dark, **colorblind** — Okabe-Ito —, mocha, dracula, nord, tokyonight,
  gruvbox, solarized, rosepine, onedark, everforest, monokai, amoled).
- `<ThemePicker />` and `<FontScalePicker />` wire the stores to the UI. Theme
  is persisted to `localStorage` and applied with no flash (head snippet in
  `app.html`) and updates the mobile `<meta name="theme-color">`.

### Stylesheets

`@dorsk/tsumikit/styles/app.css` is a shell over five files you can import
individually, in this order:

```css
@import '@dorsk/tsumikit/styles/tokens.css';
@import '@dorsk/tsumikit/styles/themes.css'; /* optional */
@import '@dorsk/tsumikit/styles/reset.css';
@import '@dorsk/tsumikit/styles/utilities.css';
@import '@dorsk/tsumikit/styles/syntax.css';
@import './brand.css';
```

| export | contents |
| --- | --- |
| `styles/tokens.css` | `:root` only — every token the kit reads (`--c-*` palette, `--bg`/`--text`/`--accent` aliases, type scale, spacing, radii, shadows, fonts, `--control-height`, …). Theme-less. |
| `styles/themes.css` | the built-in `[data-theme="id"]` blocks, one per `THEMES` entry. |
| `styles/reset.css` | reset + element defaults. |
| `styles/utilities.css` | `.container`, `.stack`, `.row`, `.sr-only`, icon sizing, … |
| `styles/syntax.css` | highlight.js / Prism class → `--syn-*` mapping. |

`styles/variables.css` = `tokens.css` + `themes.css` (kept for compatibility).
Nothing is wrapped in `@layer`: kit rules are unlayered so component-scoped
styles cascade exactly as before, and a consumer stylesheet imported **after**
the kit wins on source order at equal specificity. Do not put brand overrides
inside a `@layer` of your own — layered rules lose to the kit's unlayered ones.

### Your own theme, without vendoring

```ts
// +layout.ts (or any module that runs before first render)
import { theme } from '@dorsk/tsumikit';
theme.register({ id: 'kusaritoi', label: 'Kusaritoi', icon: '鎖', themeColor: '#2a2a2a', mode: 'dark' });
theme.setDefault('kusaritoi');
```

```css
/* brand.css — imported after the kit stylesheet(s) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');
:root { --font-mono: 'JetBrains Mono', ui-monospace, monospace; }

[data-theme='kusaritoi'] {
  color-scheme: dark;
  --c-bg: #2a2a2a;         --c-bg-elev: #323232;    --c-bg-elev-2: #3a3a3a;
  --c-surface: #323232;    --c-border: #484848;     --c-border-strong: #585858;
  --c-text: #e8e8e8;       --c-text-muted: #b0b0b0; --c-text-faint: #808080;
  --c-accent: #5ac8c8;     --c-accent-ink: #0d1f1f; --c-accent-dim: #3a8a8a;
  --c-blue: #5a9fd4;       --c-amber: #d9a543;      --c-red: #e06060;
  --c-green: #6abf69;      --c-violet: #b48ef0;     --c-gold: #d9a543;
  --c-teal: #5ac8c8;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 6px 20px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.6);
  --mach-bg-sl: 45% 24%;   --mach-fg-sl: 70% 82%;   --mach-border-sl: 45% 40%;
}
```

Contract for a `[data-theme='x']` block: all nineteen `--c-*` palette tokens,
`--shadow-sm|md|lg`, `--mach-bg-sl|fg-sl|border-sl`, and `color-scheme: light`
for a light theme (`:root` defaults to dark, so dark themes may omit it).
`--md-code-bg` is optional (derives from `--c-blue`). Everything else (`--bg`,
`--text`, `--syn-*`, …) is an alias in `tokens.css` and follows automatically.

- `theme.register(def | def[])` appends to `theme.all` (built-ins first); an
  entry with a built-in `id` replaces that built-in. `icon` and `themeColor` are
  optional. `ThemePicker` reads `theme.all`, so registered themes appear at once.
- `theme.setDefault(id)` is the theme used when `localStorage` holds nothing
  valid — set the same id as `data-theme` in your `app.html` so the no-flash
  snippet and the store agree. A persisted id that only becomes valid after
  `register()` is picked up as soon as it is registered.
- Only the palette or only the fonts? Import `tokens.css` + your `brand.css`
  and skip `themes.css`; or import the full `app.css` and override `:root`
  tokens after it. Never copy the kit files.
- Adding a built-in theme to the kit = one entry in `THEMES`
  (`stores/theme.svelte.ts`) + one block in `styles/themes.css`.

## Components

**Atoms:** Text, Heading, Button, Input (`icon` inset leading glyph,
`clearable` + `onclear`, `shape="pill"`, `width` fixed + `flex: none`,
`onenter(value)`; the bare `<input>` DOM is unchanged unless `icon`/`clearable`
is used), Textarea, Select (`options` array with per-option `icon`/`emoji`/`hint`/`disabled`;
the trigger overlays the selected option's glyph + muted hint on the native control), Switch, Checkbox,
Slider, Progress, Gauge (vertical consumption cell, `variant` continuous/segments,
threshold tones via `warnAt`/`dangerAt`, `corner` snippet), Artwork (lazy cover image with seeded gradient + initials
fallback, `aspect`, `status` overlay), Card (`tone` tints the surface for inline banners), Badge
(`tone` semantic palette or `color` for any CSS colour, `size` xs/sm/md, `dot`,
`icon`, `numeric`, `truncate`, `variant="text"`; all tints derive from
`--badge-tone`), Dot (`ring` dark halo over artwork), Link (`tone`, `underline`
always/hover/none, `align`), Icon (open registry — pass a `children` snippet for
any custom SVG).

**Molecules:** Field (`grow`), IconButton, SelectButton, Toggle, OptionButton, Modal,
Popover, Menu (items take a free-form trailing `tag` + `tagTone`, or a `tag` snippet),
Tabs, RadioGroup (`variant="rows"`: bordered rows, per-option `note`/`description`,
`action(option)` trailing control that never toggles, `below(option)` inline panel),
Tooltip, Accordion, CopyButton, FileButton,
Dropzone, CodeBlock, Callout, EmptyState, ConfirmModal, Pagination, Toaster,
ThemePicker, FontScalePicker, SectionHeader, KeyValue, LoadMore,
GitRef (branch chip + PR link tinted by state + `+N −N` diff; `collapse`
auto/never/glyph degrades to icons inside a narrow `.cq` container),
CapBar (consumption track with a draggable, keyboard-steppable cap handle; `oninput` live, `onchange` on commit),
Drawer (side-panel `<dialog>`: `side`, `width` clamped to the viewport, full-screen
under 48rem; `nav` page column that turns into a horizontal strip on narrow
screens, or `navMobile`; sticky `footer`; Escape / scrim / close button all close),
Timestamp (`mode` date/time/datetime/relative/iso/`short-iso` for a locale-independent `YYYY-MM-DD`; `utc`; click for a details popover), WorkingDir
(fish-style path chip: ancestors abbreviate left to right as the slot narrows,
then the leaf ellipsises down to `minLeaf`; `full` skips the fit, `copy` makes it
a copy-on-click button; candidates via the `workingDirCandidates` helper).
Fieldset (bordered zone, legend rides the border; `droppable` makes it an HTML5
drop target with `accepts`/`ondrop`/`dropHint` — keyboard alternative is the consumer's job).

**Organisms:** DataTable (generic `<T>`, typed columns + cell snippets;
`layout="fixed"` makes column widths authoritative, `Column.truncate` /
`nowrap` / `hideBelow="sm|md|lg"` (container-query on the table's own box),
`hideHeader` clips the header but keeps it for assistive tech, `rowTone(row)`
paints a left accent bar + `data-tone`, `rowClass(row)`, `rowActions` snippet
for a hover/focus-revealed trailing cell (always visible on touch),
`stickyOffset` for the sticky header's `top`, `size="sm"`, `loading`,
`onloadmore` footer button, `empty` as string or snippet; `data-part`
hooks on head/row/cell; `responsive="stack"` turns rows into cards below
`stackBelow` (48rem, measured on the table's own box) using `Column.role`
`title | detail | meta | actions | hidden` — detail cells get a `data-label`
prefix, the `<table>` stays a table for assistive tech), FilterSearchBar /
FilterInput (`size="sm"` compact bar on `--control-height-compact`,
`shape="pill"`, `surface`, `hotkey="/"` focuses the input from anywhere
outside an editable element, `showHotkey` renders the `<kbd>` hint, `grow`).

**Layouts:** AppShell (responsive header/sidebar/main/footer — persistent
sidebar on desktop, overlay drawer on mobile, optionally resizable;
`layout="sidebar-full"` runs the sidebar the full height with the header over
the content column only, `stickySidebar` pins it to the viewport, and
`sidebarPadding="none" | "sm" | "md"` sets the aside gutter — the header and its
children are `min-width: 0` so a wide title/actions row can't widen the grid on
mobile), NavItem
(collapses to an icon rail when the sidebar is narrow; `icon` from the
registry, `iconPath` / `iconChildren` for custom glyphs, `activeStyle="bar"`
for the inset-bar active look), MasterDetail (list + detail columns that
become two pages — one pane at a time with a sticky 44px back header — below
their own `breakpoint`, so `selected` can be driven from the URL), Container, Stack
(vertical), Cluster (wrapping row; `stackAt="xs|sm|md|lg"` makes it its own
query container and stacks children full-width below 18/30/40/48rem — phone
action rows without a viewport query), AutoGrid (intrinsically responsive
columns — no media/container query needed).

### Container

`size` caps the column (`--content-max` by default; `size="none"` fills the parent),
`gutter` overrides the `--sp-4` inline padding (safe-area insets still win),
`align="start"` drops the centering. `fullWidth` is a *viewport* breakout for
edge-to-edge sections — inside AppShell's main column use `size="none"` instead;
`inset="<left> <right>"` keeps a `fullWidth` container clear of docked panels.
Children can bleed to the column edge with
`margin-inline: calc(-1 * var(--container-gutter))`.

### ResizablePanel

Inline by default: `panel` shares the row with `children` on its `side`, drag the
edge or use the arrow keys/Home/End on the separator, collapse it with the edge
chevron; `width`/`minWidth`/`maxWidth` (px numbers or CSS lengths such as
`'12rem'`) and `widthKey` persist the width. `mode="overlay"` turns it into a
fixed non-modal drawer (`role="dialog"`) on the viewport edge: `bind:open`,
`onclose` fires on Escape, scrim click or the edge control, `scrim={false}` drops
the dim backdrop, `fullWidthBelow="960px"` makes the drawer span the viewport (no
handle, no scrim) on small screens, and `clampToViewport` (default true) keeps a
stored width inside a shrunken window. `children` is optional in overlay mode.

```svelte
<ResizablePanel mode="overlay" side="right" label="Conversation" bind:open
  width={720} minWidth={360} maxWidth="90vw" widthKey="conv-w" fullWidthBelow="960px">
  {#snippet panel()}…{/snippet}
</ResizablePanel>
```

`Scrim` (`onclose`, `hideBelow`, `z`, `label`) is the drawer's backdrop atom,
exported for custom overlays: click or Escape (document-level) calls `onclose`.
`resizeHandle` is the shared drag action behind every grip: `use:resizeHandle={{
side, min, max, step, onwidth, oncommit, onreset, onactive, measure }}` gives
any element pointer-capture + rAF-coalesced dragging, arrow/Home/End keys and
double-click reset; the width defaults to the element's parent box.

### Stacked distribution + legend

`SegmentedProgress mode="stacked"` turns the bar into one shared track whose slice
widths follow `value` (not `max`), fully filled, no gaps; a zero value collapses to
nothing. Pass a top-level `max` to show the remainder as empty track. `legend`
renders a dot + label + count per segment (`true`/`'below'` or `'inline'`), or takes
a snippet for custom rendering. In this mode the bar is `role="img"`, labelled from
the segments. `gap` (px or CSS length, default `2`) applies in segments mode, and
`tone: 'ok'` is an alias of `'success'`.

```svelte
<SegmentedProgress
  mode="stacked"
  label="Analysis"
  max={analyzedCount}
  legend
  segments={[
    { value: 412, max: 0, tone: 'ok', label: 'conforming' },
    { value: 12, max: 0, tone: 'warn', label: 'nonconforming' },
    { value: 0, max: 0, tone: 'danger', label: 'blocked' }
  ]}
/>
```

### Tinted surfaces & Callout

`Card` takes `tone="neutral" | "ok" | "warn" | "danger" | "info"` (default
`neutral`, unchanged look) to tint its border and wash its background with the
semantic hue. `Callout` builds on it for inline messages: leading glyph (auto
per tone, or `icon`), optional `title`, body, right-aligned `actions` snippet,
`dismissible` + `ondismiss`, and `busy` to show a Spinner while work runs. It
is a live region — `role="status"`, or `role="alert"` when `tone="danger"`.

```svelte
<Callout tone="danger" title="Search failed" dismissible ondismiss={clear}>
  The provider returned 503.
  {#snippet actions()}<Button size="sm" onclick={retry}>Retry</Button>{/snippet}
</Callout>
```

### Modal, ConfirmModal & Pagination

`Modal` opens on mount by default; pass `bind:open` instead to keep it mounted
and drive `showModal()`/`close()` from state (closing writes `open = false`).
`tone="danger" | "warn" | "info"` adds a title glyph and a 3px top border;
`busy` makes the body inert, shows a spinner by the title and disables Escape,
backdrop and the close button. The `footer` snippet is a right-aligned flex row
(`justify-content: flex-end; gap: var(--sp-2)`).

`ConfirmModal` wraps it as a yes/no dialog: `title`, `message` (or `children`),
`confirmLabel`/`cancelLabel`, `tone="primary" | "danger" | "warn"`, `busy`,
`onconfirm`, `oncancel`. An async `onconfirm` keeps the dialog busy until it
settles, closes only on success and shows a rejection's message (`role="alert"`)
under the body. `Button` accepts `tone="danger"` as an alias of
`variant="danger"` so the tone axis works alone.

```svelte
<ConfirmModal bind:open title="Delete library?" tone="danger" confirmLabel="Delete"
  onconfirm={() => api.deleteLibrary(id)} />
```

`Pagination` renders `<nav aria-label>` with prev/next IconButtons, numbered
pages (`aria-current="page"`), ellipses and an optional `showRange` readout.
Page mode: `bind:page` + `pageCount`. Offset mode: `bind:offset` + `limit` +
`total` (page and count are derived, `offset` is written back). `onchange(page)`,
`siblings` (1), `showEdges` (true), `size="sm" | "md"`, `label`. Under 24rem of
container width it collapses to prev / "3 / 12" / next.

```svelte
<Pagination bind:offset limit={20} total={412} showRange onchange={load} />
```

### SectionHeader, Card header/footer, KeyValue, LoadMore

`SectionHeader` is the one "title + meta + right-aligned actions" row:
`title` (or `label`), `level` 1–4 (default 2), `size`, `subtitle`, `icon`,
`count` (faint tabular figure after the title), `tone`, `hue` (0–360 swatch
chip), `uppercase` (eyebrow group label), `divider`, `sticky` (pins at
`--sticky-offset` / `--header-h` and publishes `--section-header-h` on its
parent), `collapsible` + `bind:open` (title becomes a disclosure button with
`aria-expanded`; `children` render beneath while open), `actions` snippet.
`variant="group"` is the non-wrapping list-group row: `lead` snippet (dot /
badge) · title · `count` · flexible 1px rule · `actions` (sort menu, eye toggle).

`Card` gains `header` / `footer` snippets rendered outside the padded body
behind a divider, `title` / `subtitle` / `actions` sugar that renders a
`SectionHeader` in the header slot, and `gap` to stack children as a flex
column. A Card without any of these renders exactly as before.

`KeyValue` renders `rows: { label, value: string | number | Snippet, mono?,
tone?, hint? }[]` as a semantic `<dl>` grid; `columns` 1 | 2, `dense`, `align`
start | end. `LoadMore` is the tri-state list footer: `state` idle | loading |
error | done, `onload`, `label`, `loadingLabel`, `errorLabel`, `retryLabel`,
`doneLabel`, `pill` for the compact "load older" chip.

```svelte
<Card title="Recent sessions" subtitle="last 24h">
  {#snippet actions()}<Link href="/sessions">View all</Link>{/snippet}
  <KeyValue rows={[{ label: 'Running', value: 3, tone: 'ok' }, { label: 'Host', value: 'sakura', mono: true }]} />
  {#snippet footer()}<LoadMore state={more} onload={loadMore} />{/snippet}
</Card>

<SectionHeader label="Blocked" count={4} uppercase hue={12} collapsible bind:open>
  …group rows…
</SectionHeader>
```

### Artwork

`Artwork` is the one cover/thumbnail tile: `src` + `alt` (required) render a
lazy, async-decoded `<img>`; a missing or failing source swaps to a gradient
seeded from `seed` (default `alt`) with `fallback` initials | icon | none.
`aspect` ('1/1', '2/3', '16/9' or any ratio), `size` (width), `radius`
sm | md | lg | pill, `fit` cover | contain, `hover` for tappable tiles,
`status` snippet overlaid bottom-right, `onerror`. `artworkGradient(seed)`,
`artworkHue(seed)` and `initials(text)` are exported for non-component use.

```svelte
<Artwork src={album.cover} alt={album.title} aspect="1/1" size="9rem" hover>
  {#snippet status()}<Dot status="active" ring />{/snippet}
</Artwork>
```

## Container queries

AppShell's `main` and `sidebar` are query containers (`container-name: main` /
`sidebar`), so components respond to **their box's** width, not the viewport.
Use the `.cq-*` utilities (`.cq-hide`, `.cq-stack`, `.cq-truncate`,
`.cq-hide-xs`) on children of any `.cq` container — e.g. wrap a button's label in
`.cq-hide` and it becomes icon-only when its column is tight. `NavItem` uses the
`sidebar` container to drop labels below ~8rem; `AppShell resizableSidebar` lets
you drag the sidebar down to that icon rail (width persisted).

**Stores:** `theme`, `toasts`, `fontScale` (opt-in). **Actions:** `autoresize`.

`toasts.show(message, { tone, duration, action })` plus the `ok`/`error`/`info`
shorthands (tones `neutral|ok|error|info`; `danger` aliases `error`). An `action`
(`{ label, run }`) renders a button; the toast shows a loading state while `run`
settles, then dismisses, and action toasts stay 7s instead of 4s (`duration: 0` is
sticky). `Toaster` renders in the browser top layer (`popover="manual"`), so toasts
paint above an open `Modal`; `--toast-max-width` (28rem) caps the stack.
**Helpers:** `copyToClipboard(text)` — async Clipboard API with an
insecure-context fallback; returns whether it succeeded.

## Sizing & zoom

The kit is **`rem`-based and never resets the root font-size**, so the user's
browser/OS font-size preference and browser zoom scale everything
proportionally with no code. That's the recommended path for magnification.

`fontScale` / `<FontScalePicker>` is an **opt-in** extra (drives `--fs-scale`,
text tokens only) for reading-dense apps that want larger body text while
keeping chrome compact. It isn't wired into AppShell or any default.

### Toolbar control heights

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
`Button` inside its `trigger` snippet. Omitting these props preserves the
original ghost icon-button default. Use `control` on `Button` or `Popover` when
the roomier shared `--control-height` composer contract is required.

Button and Popover share the same semantic tones. For a confirmed positive
action, `tone="success"` gives neutral controls a success tint; combine it with
`variant="primary"` for a filled success action without consumer CSS.

### Square boxes & touch targets

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
untouched. `hitArea="compact"` opts a dense-table row out. `Button
collapseLabel="mobile" | "container"` hides `<span data-label>` children below
40rem viewport / 30rem container, drops to icon padding, and names the button
from the hidden text unless `aria-label` is set:

```svelte
<Button collapseLabel="container"><Icon name="search" /><span data-label>Search</span></Button>
<Cluster stackAt="md"><Button grow>Cancel</Button><Button grow variant="primary">Save</Button></Cluster>
```

`--control-height-*` and `--box-*` are **required tokens**: a consumer that
forks `variables.css` must keep them (Button `control`, Select `sm`, every `box`)
or those controls render with unresolved sizes.

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

## Syntax highlighting (CodeBlock)

The kit ships **no** highlighter — that keeps it zero-dep and avoids shipping a
big grammar bundle to every consumer. `CodeBlock` renders the chrome (language
label, copy, line numbers, wrap, scroll) and takes code three ways: plain
`code`, a `highlight={(code, lang) => htmlString}` callback, or pre-rendered
`html`. Pick a highlighter per app:

- **highlight.js** — class-based output (`hljs-*`). Recommended for this kit:
  those classes are already mapped to the `--syn-*` theme tokens (in `app.css`),
  so highlighted code re-themes with every theme for free. Import only the
  languages you need to keep it lean.
- **Prism** — also class-based (`token.*`), mapped the same way. Similar fit.
- **Shiki** — VS Code-grade accuracy, but it emits *inline colors* from a fixed
  theme, so it won't follow your themes out of the box. Use its
  `css-variables` theme and map `--shiki-*` to your `--syn-*` tokens if you want
  it themed. Best when you want exact editor fidelity over theme-following.

```svelte
<script>
  import hljs from 'highlight.js/lib/core';
  import ts from 'highlight.js/lib/languages/typescript';
  hljs.registerLanguage('typescript', ts);
  const hl = (code, lang) => hljs.highlight(code, { language: lang ?? 'typescript' }).value;
</script>
<CodeBlock {code} lang="typescript" highlight={hl} showLineNumbers />
```

## Accessibility baseline

- Every interactive atom spreads `...rest`, so `id`, `aria-*`, `title`,
  `disabled` and native events pass through.
- Visible `:focus-visible` rings; ARIA patterns implemented for switch, menu
  (`role=menu` + roving focus), tabs (`tablist` + arrow keys), radiogroup,
  dialog; polite live region for toasts; `.sr-only`.
- Mobile-first: one `min-width: 640px` breakpoint, bottom-sheet→centered-modal,
  safe-area insets, 16px-min inputs (no iOS zoom).
- A verified color-blind-safe theme (Okabe-Ito); meaning never relies on hue
  alone (icons + text accompany every status color).
