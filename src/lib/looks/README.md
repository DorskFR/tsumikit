# Looks

A look is the kit's structural style: surfaces, edges, elevation, control fills and
interactions. It is its own axis, independent of the theme (the colors) and of the
light/dark mode. Any look works with any of the 30 built-in themes and with your own.

| id          | status       | character                                              |
| ----------- | ------------ | ------------------------------------------------------ |
| `default`   | stable       | polished: the kit as shipped, no stylesheet needed     |
| `depth`     | stable       | layered elevation, inner highlights, accent glow       |
| `tactile`   | stable       | soft raised and pressed surfaces                       |
| `editorial` | experimental | bold type scale, rules, solid tones; may change        |

## Use

Import the looks you offer, next to the kit's stylesheet. A look costs nothing until it is
active: every rule is scoped to `:root[data-look="<id>"]`.

```ts
import '@dorsk/tsumikit/styles/app.css';
import '@dorsk/tsumikit/looks/depth.css';
import '@dorsk/tsumikit/looks/tactile.css';
```

The theme store owns the look and persists it with the theme preference
(`localStorage['tsumikit-theme']`, a `look` key that is absent for the default look):

```svelte
<script lang="ts">
	import { LookPicker, ThemePicker, theme } from '@dorsk/tsumikit';
</script>

<LookPicker />
<ThemePicker auto />
<p>{theme.look}</p>
<button onclick={() => theme.setLook('depth')}>Depth</button>
```

`LOOKS` lists `{ id, label, status }`. `<LookPicker experimental={false} />` hides
experimental looks; `looks={['default', 'depth']}` restricts and orders them.

The store paints `data-theme`, `data-mode="light|dark"` and `data-look` (absent for the
default look) on `<html>`. Inline `THEME_PREPAINT` in `<head>` to paint all three before
first paint:

```svelte
<script lang="ts">
	import { THEME_PREPAINT } from '@dorsk/tsumikit';
</script>

<svelte:head>
	{@html `<script>${THEME_PREPAINT}</` + `script>`}
</svelte:head>
```

If you register your own themes, build the script with
`themePrepaint('tsumikit-theme', [...THEMES, ...yours])` so legacy single-id values resolve.

Apps that persist settings server-side get `look` inside the preference passed to
`theme.onchange`, and can replay it with `theme.hydrate(pref)`. A preference without
`look` keeps the current look.

### Pointer effects

Some looks light the surface under the mouse. Call `trackPointer()` once, client side; it
sets `--pointer-x` / `--pointer-y` on the hovered `[data-tsu]` element and its `[data-tsu]`
ancestors and returns a disposer. Looks degrade gracefully without it.

```ts
$effect(() => trackPointer());
```

## Writing a look

`src/lib/looks/<id>.css`, plus an entry in `LOOKS` (`src/lib/theme-mode.ts`).
`tests/looks-lint.test.js` enforces the first three rules.

1. **Scope everything** under `:root[data-look="<id>"]`. Light-only tweaks go under
   `:root[data-look="<id>"][data-mode="light"]`; prefer recipes that work in both modes.
   `@keyframes` are global: namespace their names.
2. **No literal colors.** No hex, no `rgb()`/`hsl()`/`oklch()`/`lab()` with channel
   numbers, no named colors (`black` and `white` included) except `transparent` and
   `currentColor`. Derive every color from the active theme:
   `var(--accent)`, `color-mix(in oklab, var(--accent) 30%, transparent)`,
   `oklch(from var(--accent) l c h / 0.4)`; shadows from
   `oklch(from var(--bg) calc(l * 0.4) c h / 0.6)` or
   `color-mix(in oklab, var(--text) 18%, transparent)`.
3. **No `transition: all`.** Durations come from `--dur-*`.
4. **Tokens first.** Override the structural tokens in `styles/tokens.css` ("Structural
   look": surface, raised, overlay, control, track, thumb and button fills, edges and
   shadows, `--edge-width`, `--hover-lift`, `--focus-glow`). Add per-component rules
   (`:root[data-look="<id>"] [data-tsu="Card"]`) only where a token cannot express it.
5. **Motion:** hover-only effects inside `@media (hover: hover) and (pointer: fine)`;
   respect `prefers-reduced-motion`.
6. **Contrast**, for every theme in both modes: text ≥ 4.5:1, UI boundaries and focus
   rings ≥ 3:1. A look must not lower text contrast; it should rarely touch text colors.

Palette tokens available to a look: `--bg`, `--bg-elevated`, `--bg-elevated-2`,
`--surface`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--text-faint`,
`--accent`, `--text-on-accent`, `--ok`, `--warn`, `--danger`, `--info` and the `--c-*`
palette.
