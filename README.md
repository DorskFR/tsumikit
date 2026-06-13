# @dorsk/uikit

A minimal, **dependency-free** UI kit for Svelte 5 + pure CSS. Token-driven
atoms and molecules with theming, font-scaling, a color-blind-safe theme and
mobile/a11y baked in. No CDNs, no runtime UI dependencies — just Svelte 5 as a
peer.

## Design

Each layer reaches only one layer down (the layered model from cctui's
`DESIGN.md`):

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

## Run the showcase

```bash
npm install
npm run dev      # open the printed URL — single page with every component
npm run check    # svelte-check
npm run build    # static SPA in /build
```

## Use in your own project

```ts
import '@dorsk/uikit/styles/app.css';            // once, at the app root
import { Button, Field, Input, Modal, ThemePicker } from '@dorsk/uikit';
```

```svelte
<Field label="Name" for="name">
  <Input id="name" bind:value={name} />
</Field>
<Button variant="primary" onclick={save}>Save</Button>
```

## Theming

- 17 themes ship (dark, light, sepia, **colorblind** — Okabe-Ito —, plus mocha,
  dracula, nord, tokyonight, gruvbox, solarized, rosepine, onedark, everforest,
  monokai, amoled, highcontrast).
- A new theme = one entry in `THEMES` (`stores/theme.svelte.ts`) + one
  `[data-theme="id"]` block in `variables.css`. Nothing else changes.
- `<ThemePicker />` and `<FontScalePicker />` wire the stores to the UI. Theme
  is persisted to `localStorage` and applied with no flash (head snippet in
  `app.html`) and updates the mobile `<meta name="theme-color">`.

## Components

**Atoms:** Text, Heading, Button, Input, Textarea, Select, Switch, Card, Badge,
Chip, Link, Icon (open registry — pass a `children` snippet for any custom SVG).

**Molecules:** Field, IconButton, SelectButton, Toggle, OptionButton, Modal
(focus-trapped, resizable), ThemePicker, FontScalePicker.

## What's "state of the art" here

- Every interactive atom spreads `...rest`, so `id`, `aria-*`, `title`,
  `disabled` and native events pass through.
- Visible `:focus-visible` rings, `role="switch"`/`aria-checked`,
  `aria-pressed`, `aria-modal` + focus trap + focus restore, `.sr-only`.
- Mobile-first: one `min-width: 640px` breakpoint, bottom-sheet→centered-modal,
  safe-area insets, 16px-min inputs (no iOS zoom), `prefers-reduced-motion`.
- A verified color-blind-safe theme; meaning never relies on hue alone.
