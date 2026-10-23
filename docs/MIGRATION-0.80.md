# Migrating to Tsumikit 0.80

For apps still on **0.18, 0.54, 0.56, 0.61 or 0.73**. On 0.x, a caret range only allows patch
updates (`^0.61.0` never resolves to 0.62), so each of these apps needs a manual bump:

```sh
npm i @dorsk/tsumikit@^0.80.0   # peer: svelte ^5.0.0 (unchanged since 0.18)
```

Start at [section 1](#1-tldr), then read section 2 from the row for your current version down to
0.80. Sections 3–5 apply to everyone.

Each claim was checked against the git tags (`git diff vX vY`, the component sources and
`package.json`). Items marked **(notes)** come only from the GitHub release notes, and I couldn't
confirm them in a diff. Twelve tags have no GitHub release (0.18.5–0.18.8, 0.19.0, 0.35.1,
0.42.0, 0.53.0, 0.55.0, 0.66.1, 0.70.0, 0.73.2); they're covered from `git log`.

## 1. TL;DR

**The API was only added to.** Between 0.18.0 and 0.80.0:

- **Package entry point:** no export was removed, renamed or moved; it went from 117 to 277 names.
- **Components:** no prop was removed from any exported component. When a prop default changed,
  the old value still applies unless you use one of the new props (see the tables).
- **Tokens:** no CSS custom property was removed (113 → 213 declared).
- **Stylesheets:** `styles/app.css` and `styles/variables.css` still exist and still load
  everything.

**What tends to break or look different:**

1. **A hand-written theme script in `app.html` (0.47).** `localStorage['tsumikit-theme']` now
   holds a JSON blob, not a theme id. The old snippet writes the JSON text into `data-theme`, so
   the page shows the wrong theme until the app hydrates. Replace the snippet with `THEME_PREPAINT`.
2. **Accordion CSS (0.58).** Accordion renders Disclosures now, not `<details>`/`<summary>`.
3. **`<Link>` underline (0.72).** The default changed from `always` to `hover`.
4. **Sizes (0.74–0.75).** md boxes are 40px (were 36px), focus rings sit 2px away (were 1px),
   Toggle is 32px (was 24px), and md field text is 13px on desktop (was 16px).
5. **Micro-interactions are on by default in 0.80.** With no `data-fx-*` attribute, every family
   uses its first variant (smoke hover on buttons, drawn checkmarks, and so on). See
   [section 4.2](#42-micro-interactions) to turn them off.
6. **Colours (0.66, 0.80).** Palettes were adjusted for WCAG AA, and Callout tones are now tinted
   (0.78).
7. **TypeScript:** a `@ts-expect-error` or cast you added for `Input`/`Textarea` `onsubmit` is now
   unused and fails `svelte-check` (0.77).

**Checklist**

- [ ] Bump to `^0.80.0`, then run `svelte-check` / `tsc`.
- [ ] Replace any hand-written theme script in `app.html` with `THEME_PREPAINT` (4.1).
- [ ] Search your CSS for `details`, `summary` and `.accordion` selectors that target Accordion.
- [ ] Search for `<Link` without `underline`; add `underline="always"` inside prose.
- [ ] If you import only `syntax.css` or a custom set of style files, also import `reset.css`
      (the reduced-motion and forced-colors rules moved there in 0.72).
- [ ] Decide on micro-interactions: keep the defaults, or opt out (4.2).
- [ ] Do the visual pass in [section 5](#5-visual-check-after-upgrading).

## 2. API changes by range

Read every table from your current version down. "Action" is what a consumer has to do; *none*
means the change is additive or only visible.

### 0.18 → 0.54

| Area | Before (0.18) | After | Action |
| --- | --- | --- | --- |
| Theme storage (0.47) | `localStorage['tsumikit-theme'] = 'nord'` | `'{"mode":"dark","light":"light","dark":"nord"}'` | Replace the head script (below). A stored bare id still loads and pins its own slot. Downgrading can't read the blob. |
| Theme store types (0.24) | `theme.current: Mode`; `theme.option` has required `icon` and `themeColor` | `theme.current: ThemeId` (`Mode \| string`); `theme.option: ThemeDef` with optional `icon` and `themeColor` | Handle `undefined` if you read `theme.option.themeColor` / `.icon`. |
| Theme store API (0.24, 0.47) | `set`, `toggle`, `current`, `next`, `label`, `icon` | All still there. New: `register()`, `setDefault()`, `all`, `has()`, `choose(id \| 'auto')`, `mode`, `pref`, `resolved`, `choice`, `hydrate()`, `onchange` | None. Use `theme.register([...])` for custom themes instead of patching `THEMES`. |
| Stylesheets (0.24) | `styles/app.css`, `styles/variables.css` | Also `tokens.css`, `themes.css`, `reset.css`, `utilities.css`, `syntax.css` | None. `app.css` still imports all of them. |
| `Select` `compact` | Deprecated alias | Still deprecated, still works | Prefer `size="sm"`. |
| `EmptyState` `compact` | Plain prop | Deprecated (0.39) | Prefer `size="compact"`. |
| `Popover` trigger CSS (0.40.2, 0.44.1) | Default trigger box had normal specificity | Default chrome sits under `:where(.pop-trigger:not(.bare))` (zero specificity) | Your `triggerClass` styles now win. Remove any `!important` you used to beat the kit. |
| Field labelling (0.34) | — | `Field` gives its child control the `id`, `aria-describedby` and `aria-invalid`. Unlabelled controls log a dev warning | Expect new console warnings in dev for unlabelled inputs. |
| Control heights (0.27, 0.39) **(notes)** | FilterInput/FilterSearchBar md were 44px | md uses `--control-height-default` (40px); Input/Select follow the same control-height scale | Visual check. |
| `Tone` (0.29, 0.39) | Per-component tone unions | Shared `Tone` type; `success` is an alias of `ok` | None. |
| `CopyButton` `showLabel` | Default `true` | Default `showLabel ?? box === undefined` | None, unless you pass the newer `box` prop. Then the label is hidden unless `showLabel`. |
| `Select` `chevron` | Default `true` | Default `chevron ?? variant !== 'embedded'` | None (`embedded` is new). |
| `Switch` `checked` | Plain prop | `$bindable` | None. `bind:checked` now works. |

Head script, before (the snippet the kit's own `app.html` shipped up to 0.79):

```html
<script>
	try {
		var t = localStorage.getItem('tsumikit-theme');
		if (t) document.documentElement.setAttribute('data-theme', t);
	} catch (e) {}
</script>
```

After (0.80): delete it from `app.html` and inline the kit's script from your root layout:

```svelte
<script lang="ts">
	import { THEME_PREPAINT } from '@dorsk/tsumikit';
</script>

<svelte:head>
	{@html `<script>${THEME_PREPAINT}</` + `script>`}
</svelte:head>
```

If you call `theme.register()`, build the script with your themes so stored ids resolve:
`themePrepaint('tsumikit-theme', [...THEMES, ...myThemes])` (each entry needs `id` and `mode`).
Keep a default `data-theme="…"` on `<html>` that matches `theme.setDefault()`. The script does
nothing when storage is empty.

### 0.54 → 0.56

No breaking changes. In 0.55, menu entries, tabs, search bars and popovers accept anchor
attributes (new `AnchorAttributes` type). In 0.56, `FilterInput` gets a display seam for a blurred
single-key value.

### 0.56 → 0.61

| Area | Before | After | Action |
| --- | --- | --- | --- |
| `Accordion` markup (0.58) | `<details>`/`<summary>` per item | A stack of `Disclosure`s | Point CSS at `.acc-item` / `.disclosure__button`. Props are unchanged; `summary` snippet and controlled `open` are new. |
| `Input` / `Textarea` `size` | Default `'md'` | `size ?? group?.size ?? 'md'` | None outside an `InputGroup`. |
| Field font floor (0.57) **(notes)** | Some size modifiers dropped below 16px | Touch keeps the 16px anti-zoom floor under every size | None. |
| `Popover` / `Menu` `bind:open` (0.58.1) **(notes)** | Ignored before the first open | Works immediately | Remove workarounds. |

New since 0.56: `Disclosure`, `Combobox`, `SplitButton`, `InputGroup` (Composer is rebuilt on
it), `Avatar`, `Swatch`, `GlyphStack`. Also `count` on Button, IconButton and the Popover trigger,
`Badge` `actionIcon`/`onaction`/`removed`, and closable strip-only `Tabs`.

### 0.61 → 0.73

| Area | Before | After | Action |
| --- | --- | --- | --- |
| `Link` `underline` (0.72) | Default `'always'` | Default `'hover'` (since 0.76, only on fine pointers) | Add `underline="always"` inside prose or anywhere the underline carries meaning. |
| Global a11y CSS (0.72) | Reduced-motion, forced-colors and prefers-contrast rules lived in `syntax.css` | Moved to `reset.css` | Import `reset.css` if you hand-pick style files. `app.css` users: none. |
| `Badge` (0.71) | Off-scale sm/xs font (`* 0.92`) | `--fs-xs`; `tone` takes the shared `Tone` | Visual check. |
| `Select size="sm"` (0.71) **(notes)** | A min-height overrode it | Renders at `--control-height-compact` | Visual check. |
| Card `as="button"` (0.72) | No default `type` | `type="button"` (Badge too, **(notes)**) | Pass `type="submit"` explicitly if you relied on submitting a form. |
| `SectionHeader` with `lead` (0.73) | Lead after the chevron | Lead before the chevron | Visual check. |
| `filterQuery` (0.73) **(notes)** | `..` was a range on any field; LIKE patterns unescaped | `..` is a range only on number and date fields; `toSql` escapes LIKE; `\\` inside quotes is an escaped backslash | Re-test saved queries that use `..` on text fields. |
| `DataTable` stack mode (0.71) | Auto table layout | `table-layout: fixed`; empty cells get `data-empty` and are hidden | Visual check on narrow screens. |
| Touch targets (0.64.1–0.73.1) | — | Invisible coarse-pointer hit areas (new `--touch-slab`, `--touch-target-compact`); custom `::-webkit-scrollbar` only on fine pointers | None. |
| Palettes (0.66) | — | AA contrast floors per theme, plus seven dim themes: `stone`, `fog`, `sage` (light) and `slate`, `moss`, `espresso`, `zenburn` (dark) | Visual check. `--c-border-strong` and `--c-text-faint` got lighter in the base palette. |
| `SelectButton` (0.73) **(notes)** | Two focus stops | One valid focus stop | None. |

New since 0.61: `ConversationPanel`, `ConversationFeed`, `StatusBar`, `renderMarkdown`,
`SortableList`, `RadialMenu`, `TabBar`, `SwipeRow`, `PullToRefresh`, `SeekSlider`, `VolumeSlider`,
`TimeDisplay`, plus media-time helpers.

### 0.73 → 0.80

| Area | Before (0.73) | After (0.80) | Action |
| --- | --- | --- | --- |
| md box (0.74) | `--box-md: 2.25rem` (36px) | `2.5rem` (40px). md IconButton, SelectButton, Pagination and the Popover trigger are 40px | Check dense toolbars. To get 36px back for one area, set `--box-md: 2.25rem` on it. |
| Focus ring (0.74) | `--focus-ring-offset: 1px` | `2px`; new `--focus-ring-width` and `--focus-ring-offset-inset` (rings are inset where a parent clips) | Check tight containers with `overflow: hidden`. |
| `Toggle` height (0.75) | 24px default, 32px for `size="md"` | 32px default (`--control-sm`), 40px for md | Set `--toggle-size` to restore dense chips. |
| Field text (0.75) | md Input 16px everywhere | 13px (`--control-fs-md`) on fine pointers; touch keeps the 16px floor | Visual check. |
| `Input` / `Textarea` `onsubmit` (0.77) | `(value: string) => void` collided with the native attribute type | Native `onsubmit` is omitted from the props type | Remove `@ts-expect-error` / casts; they now fail as unused. |
| `SelectButton` `disabled` (0.77) | Not a prop (fell through `...rest`) | Typed `disabled?: boolean` that dims the control | None. |
| `Button` `loading` | `boolean` | `boolean \| 'done'`; new `loadingStyle: 'spinner' \| 'morph' \| 'fill'` (default `'spinner'`), plus a progress value for `fill` | None. The default is unchanged. |
| `Spinner` `variant` (0.74, 0.80) | No variants | `SpinnerVariant`: `icon` (default) `arc` `dots` `orbit` `pulse` `bars` `grid` `clock` `bounce` `comet` `breath` `morph` `sweep` | None. |
| `sound` prop (0.75) | — | Optional on interactive components; silent until the `sound` store is turned on | None. |
| Callout tones (0.78, 0.79) | All tones rendered in muted grey | ok/warn/danger/info/accent are tinted | Visual check. |
| `<html>` attributes (0.80) | `data-theme` | Also `data-mode="light\|dark"`, plus `data-look` when a look is set | Check that nothing in your CSS already uses `[data-mode]` or `[data-look]`. |
| Theme blob (0.80) | `{mode,light,dark}` | Also `look` when it isn't the default; `hydrate()` keeps the current look if the preference has no `look` | Server-side mirrors via `onchange` will now get `look`. |
| Micro-interactions (0.80) | — | On by default; see 4.2 | Opt out if you want the old feel. |
| Long button labels (0.75) | Overflowed | Wrap | Visual check. |
| `Toggle grow` with icon + text (0.77) | 4px gap | The gap is gone (the label became a block so it can truncate) | Visual check. |

New since 0.73: `RichSelect`, `Thinking`, `SoundSettings`, `MotionSettings`, `LookPicker`, the
stores `sound`, `fx`, `theme.look`/`theme.setLook()`, and `playSound`, `trackPointer`,
`THEME_PREPAINT`, `FX_PREPAINT`, `themePrepaint`, `fxPrepaint`, `LOOKS` and `FX`.

## 3. CSS

### Entry points (`package.json` `exports`)

| Path | Since | Notes |
| --- | --- | --- |
| `@dorsk/tsumikit/styles/app.css` | ≤0.18 | Everything: variables (tokens + themes), reset, utilities, syntax |
| `@dorsk/tsumikit/styles/variables.css` | ≤0.18 | Compatibility shell = `tokens.css` + `themes.css` |
| `styles/tokens.css`, `themes.css`, `reset.css`, `utilities.css`, `syntax.css` | 0.24 | Import them one by one to ship your own palette (`tokens.css` + your file, without `themes.css`) |
| `@dorsk/tsumikit/looks/*.css` | 0.80 | `depth.css`, `tactile.css`, `editorial.css` (experimental). Inert until `data-look` matches |

### Token value changes visible after upgrading

| Token | Old | New | Since |
| --- | --- | --- | --- |
| `--box-md` | `2.25rem` | `2.5rem` | 0.74 |
| `--focus-ring-offset` | `1px` | `2px` | 0.74 |
| `--c-border-strong` (base dark palette) | `#3a414e` | `#68707e` → `#757d8b` | 0.66 → 0.80 |
| `--c-text-faint` (base dark palette) | `#6b7384` | `#848c9e` → `#929bad` | 0.66 → 0.80 |
| `themes.css` palettes | — | 249 lines changed in 0.80 (mainly `--c-text-faint`, `--c-border-strong`, accents, `--c-red`/`--c-green`/`--c-teal`) | 0.66, 0.80 |

No token was renamed or removed. Tokens you overrode keep working.

### Tokens added

- **0.23–0.39:** `--box-xs|sm|md|lg`, `--touch-target`, `--focus-ring`, `--focus-ring-offset`.
- **0.71:** `--touch-slab`, `--touch-target-compact`.
- **0.74, control and spacing scale:**
  - control tiers: `--control-sm|md|lg`, `--control-fs-*`, `--control-px-*`, `--control-icon-*`, `--btn-px-*`
  - chips: `--chip-xs|sm|md`
  - icons: `--icon-xs…xl`
  - type and spacing: `--fs-2xs`, `--fs-3xl`, `--lh-none|snug|heading`, `--sp-px`, `--sp-0-5`, `--sp-1-5`, `--r-xs`
  - states: `--disabled-opacity`, `--focus-ring-width`, `--focus-ring-offset-inset`
- **0.74, motion:** `--dur-*`, `--ease-*` (spring curves via `linear()`), `--press-scale*`, `--shift-*`,
  `--enter-scale`, `--tip-scale`. 0.80 adds `--dur-release` (150ms).
- **0.79, structural tokens.** Components read these instead of hard-coded borders and shadows:
  - `--surface-fill`, `--surface-fill-2`, `--surface-edge`, `--surface-edge-strong`, `--surface-shadow`, `--surface-shadow-hover`
  - `--raised-*`, `--overlay-*`
  - `--control-fill`, `--control-edge`, `--control-edge-hover`, `--control-shadow`
  - `--track-*`, `--thumb-*`
  - `--btn-fill`, `--btn-edge`, `--btn-shadow`, `--btn-shadow-hover`, `--btn-primary-*`
  - `--edge-width` (1px), `--hover-lift` (0px), `--focus-glow` (transparent)

  With the defaults, everything looks as it did in 0.78; the release notes report that computed
  styles were compared in Chromium. Per-component hooks such as `--btn-bg`, `--input-bg` and
  `--cb-border` still take precedence.

## 4. Opting in (optional)

### 4.1 Looks

A look restyles structure (elevation, edges, radius, surfaces, glow, motion feel). It doesn't
change colour, so it works with every theme.

```ts
// root +layout.svelte or main entry, after the kit stylesheet
import '@dorsk/tsumikit/styles/app.css';
import '@dorsk/tsumikit/looks/depth.css';
import '@dorsk/tsumikit/looks/tactile.css';
```

```svelte
<script lang="ts">
	import { LookPicker, ThemePicker, THEME_PREPAINT, theme, trackPointer } from '@dorsk/tsumikit';
	$effect(() => trackPointer()); // optional: pointer spotlights; returns its disposer
</script>

<svelte:head>
	{@html `<script>${THEME_PREPAINT}</` + `script>`}
</svelte:head>

<LookPicker experimental={false} />   <!-- or looks={['default', 'depth']} -->
<ThemePicker auto />
<button onclick={() => theme.setLook('depth')}>Depth</button>
```

`theme.setLook(id)` persists the look in the theme blob. Unknown ids fall back to `default`, which
removes `data-look`. `THEME_PREPAINT` paints `data-theme`, `data-mode` and `data-look` before first
paint. Only import the look stylesheets you offer.

### 4.2 Micro-interactions

Each effect family reads `data-fx-<family>` from the closest ancestor that sets it. When no
ancestor sets it, the family's first variant applies. **So they're on after the upgrade.**

| Family | Variants (first = default) |
| --- | --- |
| `hover` (buttons) | `smoke` `ember` `aurora` `none` |
| `check` | `draw` `pop` `confetti` `morph` `none` |
| `radio` | `spring` `liquid` `none` |
| `switch` | `squash` `glow` `calm` `none` |
| `focus` (inputs) | `bloom` `label` `none` |
| `tabs` | `pill` `stretch` `ink` `none` |
| `copy` | `burst` `tick` `none` |
| `link` | `sweep` `highlight` `none` |
| `card` | `spotlight` `orbit` `none` |

Hover effects only run on fine pointers. Under `prefers-reduced-motion`, effects fall back to a
static state change. Loaders aren't a family: use the `Spinner` `variant` prop, Progress and
Skeleton props, and Button `loadingStyle`.

Let users pick, and persist the choice:

```svelte
<script lang="ts">
	import { FX_PREPAINT, MotionSettings, THEME_PREPAINT, fx } from '@dorsk/tsumikit';
</script>

<svelte:head>{@html `<script>${THEME_PREPAINT}${FX_PREPAINT}</` + `script>`}</svelte:head>
<MotionSettings size="sm" />
```

`fx.set(family, variant)`, `fx.reset()`, `fx.onchange` and `fx.hydrate(settings)` mirror the theme
store. Storage key: `tsumikit-fx`.

**To opt out**, set `none` on an ancestor:

```html
<body data-fx-hover="none" data-fx-check="none" data-fx-radio="none" data-fx-switch="none"
      data-fx-focus="none" data-fx-tabs="none" data-fx-copy="none" data-fx-link="none"
      data-fx-card="none">
```

Prefer `<body>` or an app wrapper over `<html>`. Once anything is saved under `tsumikit-fx`, the
`fx` store rewrites the attributes on `<html>` and removes the ones that match the default. An
attribute on an inner element always wins (closest ancestor), and the store never touches it.
I checked the closest-wins selector in Button; for the other families, this relies on `fx.md`.

### 4.3 Sound

Sound is off by default and the synth isn't loaded until it's on. Add `<SoundSettings />`
(toggle, volume, preview), or set `sound.enabled` and call `playSound(name)`.

## 5. Visual check after upgrading

Check in at least one light and one dark theme, on desktop and on a phone:

- **Focus rings:** 2px offset; inset inside clipping parents. Tab through toolbars, tables and
  cards with `overflow: hidden`.
- **Control heights:**
  - md icon buttons, select buttons, pagination and popover triggers grow from 36 to 40px
  - Toggle grows from 24 to 32px
  - FilterInput md went from 44 to 40px (0.27)
  - check fixed-height toolbars and rows
- **Field text:** 13px on desktop at md.
- **Callouts:** tones are coloured. Callouts that were "accidentally neutral" now stand out.
- **Links:** no underline at rest, unless you pass `underline="always"`.
- **Palettes:** faint text, strong borders and accents are brighter or more saturated for AA.
  Recheck anything you matched by hand against the old hex values.
- **Accordion:** spacing and the chevron come from Disclosure now.
- **Micro-interactions:** button hover smoke, checkbox draw, tab pill and card spotlight. Keep
  them or opt out (4.2).
- **Wrapping:** long Button labels wrap. RadioGroup, Toggle, Divider, CopyButton, FileButton,
  Select and Field truncate or wrap instead of overflowing (0.77).
- **Touch:** invisible hit areas extend toward inline-start. Check rows of small icon buttons on
  touch screens (0.64.1, 0.67.1).
