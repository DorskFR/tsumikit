# Theming

[Back to the README](../README.md)

- 31 themes ship (light, highcontrast, gruvboxlight, solarizedlight,
  everforestlight, rosepinedawn, latte, nordlight, tokyoday, kanagawalotus,
  sepia, dark, **colorblind** — Okabe-Ito —, mocha, dracula, nord, tokyonight,
  gruvbox, solarized, rosepine, onedark, everforest, monokai, amoled), plus a
  **dim** tier between the bright and dark extremes: stone, fog, sage (light)
  and slate, moss, espresso, zenburn (dark).
- Every built-in clears WCAG AA on `bg`, `bg-elev` and `surface`: text 7:1,
  muted 4.5:1, every accent/status hue 4.5:1, `accent-ink` on `accent` 4.5:1,
  and `--c-border-strong` (the outline of every control) 3:1.
- Three text levels: `--text` for values and titles, `--text-muted` for labels
  and secondary text (4.5:1), `--text-faint` only for placeholders, disabled
  and decorative text (3:1, and muted is at least 1.35x faint so the step is
  visible).
- The accent is never a status colour: every theme keeps `--c-accent` at least
  OKLab deltaE 0.08 away from `--c-green`, `--c-amber` and `--c-red`, so the
  primary action never reads as "success".
  `tests/theme-contrast.mjs` holds the floors; the test suite fails on any
  breach.
- `<ThemePicker />` and `<FontScalePicker />` wire the stores to the UI. Theme
  is persisted to `localStorage` and applied with no flash (head snippet in
  `app.html`) and updates the mobile `<meta name="theme-color">`.
- The store keeps a **preference**, not just an id: one remembered light theme,
  one remembered dark theme, and which of the two is pinned — or `auto`, which
  follows `prefers-color-scheme` and repaints when the system flips.
  `theme.choose(id | 'auto')`, `theme.mode`, `theme.pref`, `theme.resolved`,
  `theme.hydrate(pref)` (replay a server-side preference) and
  `theme.onchange = (pref) => …` (mirror it back). `theme.set(id)` and
  `theme.current` also work. `<ThemePicker auto />` adds the "Auto" row;
  its labels (`autoLabel`, `autoHelp`, `lightLabel`, `darkLabel`) are props.
- **Storage format:** `localStorage['tsumikit-theme']` holds
  `{"mode","light","dark"}`. A bare theme id written by a version before 0.47
  still loads and pins its own slot; a version before 0.47 cannot read the blob
  and falls back to the default theme.

## Looks

Optional looks (`depth`, `tactile`, `editorial`) change shape and elevation on
top of any theme. Import `@dorsk/tsumikit/looks/depth.css` and call
`theme.setLook('depth')`, or render `<LookPicker />`. Details:
[MIGRATION-0.80.md](MIGRATION-0.80.md).

## Typeface

`styles/app.css` bundles [Inter](https://rsms.me/inter/) (variable, latin subset, OFL-1.1, licence in
`styles/fonts/`) through `styles/font.css` and lists it first in `--font-sans`. Counts, stat values,
eyebrow labels and shortcut hints (`--font-numeric`, `--font-label`) are sans by default; only code
(`CodeBlock`, `Kbd`, `GitRef`, `Text variant="code"`) stays monospace.

To opt out, import `tokens.css` / `themes.css` without `font.css`, or override `--font-sans`.
Reading text is capped at `--measure` (68ch): `Prose` always, `Text` with `measure`; set
`--measure: none` on a container to lift it.

## Stylesheets

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
| `styles/reset.css` | reset + element defaults, global reduced-motion / forced-colors / prefers-contrast rules. |
| `styles/utilities.css` | `.container`, `.stack`, `.row`, `.sr-only`, icon sizing, … |
| `styles/syntax.css` | highlight.js / Prism class → `--syn-*` mapping. |

`styles/variables.css` = `tokens.css` + `themes.css` (kept for compatibility).
Nothing is wrapped in `@layer`: kit rules are unlayered so component-scoped
styles cascade normally, and a consumer stylesheet imported **after**
the kit wins on source order at equal specificity. Do not put brand overrides
inside a `@layer` of your own — layered rules lose to the kit's unlayered ones.

## Your own theme, without vendoring

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
