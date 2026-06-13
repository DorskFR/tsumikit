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

- 17 themes ship (dark, light, sepia, **colorblind** — Okabe-Ito —, plus mocha,
  dracula, nord, tokyonight, gruvbox, solarized, rosepine, onedark, everforest,
  monokai, amoled, highcontrast).
- A new theme = one entry in `THEMES` (`stores/theme.svelte.ts`) + one
  `[data-theme="id"]` block in `variables.css`. Nothing else changes.
- `<ThemePicker />` and `<FontScalePicker />` wire the stores to the UI. Theme
  is persisted to `localStorage` and applied with no flash (head snippet in
  `app.html`) and updates the mobile `<meta name="theme-color">`.

## Components

**Atoms:** Text, Heading, Button, Input, Textarea, Select, Switch, Checkbox,
Slider, Progress, Card, Badge, Dot, Link, Icon (open registry — pass a
`children` snippet for any custom SVG).

**Molecules:** Field, IconButton, SelectButton, Toggle, OptionButton, Modal,
Popover, Menu, Tabs, RadioGroup, Tooltip, Accordion, CopyButton, FileButton,
Dropzone, CodeBlock, Toaster, ThemePicker, FontScalePicker.

**Organisms:** DataTable (generic `<T>`, typed columns + cell snippets).

**Layouts:** AppShell (responsive header/sidebar/main/footer — persistent
sidebar on desktop, overlay drawer on mobile, optionally resizable), NavItem
(collapses to an icon rail when the sidebar is narrow), Container, Stack
(vertical), Cluster (wrapping row), AutoGrid (intrinsically responsive columns —
no media/container query needed).

## Container queries

AppShell's `main` and `sidebar` are query containers (`container-name: main` /
`sidebar`), so components respond to **their box's** width, not the viewport.
Use the `.cq-*` utilities (`.cq-hide`, `.cq-stack`, `.cq-truncate`,
`.cq-hide-xs`) on children of any `.cq` container — e.g. wrap a button's label in
`.cq-hide` and it becomes icon-only when its column is tight. `NavItem` uses the
`sidebar` container to drop labels below ~8rem; `AppShell resizableSidebar` lets
you drag the sidebar down to that icon rail (width persisted).

**Stores:** `theme`, `toasts`, `fontScale` (opt-in). **Actions:** `autoresize`.

## Sizing & zoom

The kit is **`rem`-based and never resets the root font-size**, so the user's
browser/OS font-size preference and browser zoom scale everything
proportionally with no code. That's the recommended path for magnification.

`fontScale` / `<FontScalePicker>` is an **opt-in** extra (drives `--fs-scale`,
text tokens only) for reading-dense apps that want larger body text while
keeping chrome compact. It isn't wired into AppShell or any default.

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
