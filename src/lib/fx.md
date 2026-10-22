# Micro-interactions

Each component family has a set of effects. One attribute on `<html>`, or on any ancestor, picks the
effect for that family:

```html
<html data-fx-hover="ember" data-fx-check="pop"></html>
```

With no attribute the first variant applies. `none` turns the family's effect off.

| Family   | Attribute        | Variants (first = default)              |
| -------- | ---------------- | --------------------------------------- |
| `hover`  | `data-fx-hover`  | `smoke` `ember` `aurora` `none`         |
| `check`  | `data-fx-check`  | `draw` `pop` `confetti` `morph` `none`  |
| `radio`  | `data-fx-radio`  | `spring` `liquid` `none`                |
| `switch` | `data-fx-switch` | `squash` `glow` `calm` `none`           |
| `focus`  | `data-fx-focus`  | `bloom` `label` `none`                  |
| `tabs`   | `data-fx-tabs`   | `pill` `stretch` `ink` `none`           |
| `copy`   | `data-fx-copy`   | `burst` `tick` `none`                   |
| `link`   | `data-fx-link`   | `sweep` `highlight` `none`              |
| `card`   | `data-fx-card`   | `spotlight` `orbit` `none`              |

Loaders aren't a page setting. They're component props: Spinner, Progress, Skeleton and Button
`loadingStyle`.

All effects take their colours from the theme, fall back to a static state change under
`prefers-reduced-motion: reduce`, only animate hover on fine pointers, and never shift layout.

## Persisted settings

```svelte
<script>
	import { FX_PREPAINT, MotionSettings, fx } from '@dorsk/tsumikit';
</script>

<svelte:head>{@html `<script>${FX_PREPAINT}</` + `script>`}</svelte:head>

<MotionSettings size="sm" />
```

- `fx` holds the settings (`fx.settings`, `fx.get(family)`, `fx.set(family, variant)`, `fx.reset()`), stores
  the non-default families in localStorage under `tsumikit-fx` and writes `data-fx-*` on `<html>`. Defaults
  leave the attribute absent.
- `FX_PREPAINT` paints the saved attributes before first paint. Inline it in `<head>` next to
  `THEME_PREPAINT`.
- `fx.onchange` and `fx.hydrate(settings)` let an app keep the settings in its own (server-side) store.
- `FX`, `FX_FAMILIES`, `DEFAULT_FX` and `parseFx` expose the registry for custom controls.

## Writing an effect

Scope every variant with `:where()` so the selector keeps zero specificity. Give the first variant the
`:not([…])` default:

```css
:where(:root:not([data-fx-hover]), [data-fx-hover='smoke']) .btn-primary::before { … }
:where([data-fx-hover='ember']) .btn-primary::before { … }
```
