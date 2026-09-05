# tsumikit — tokens + the real Svelte components

tsumikit is a **Svelte 5 + pure-CSS** UI kit. This project carries the **real styling layer** (synced from the repo) and **every one of the kit's components, compiled from the actual Svelte source** and exposed to React through a thin bridge. What you render here is the production component with its own scoped CSS, not a mirror.

## Components

All exports live on `window.Tsumikit_a4c6ce`. Each has a card and a `.prompt.md` with its prop table under `components/<Group>/<Name>/`.

```html
<script src="_ds_bundle.js"></script>
<script>
  const { Button, Card, snippet } = window.Tsumikit_a4c6ce;
</script>
```

**Props go to the Svelte component verbatim.** Use Svelte's names, not React's: `onclick` not `onClick`, `class` not `className`, `oninput` not `onChange`. React-style names are silently ignored. Children pass through as the component's default snippet.

**Snippet props** (typed `Snippet<...>` in the prop table, e.g. `Tabs.panel`) take a React element, or a function wrapped in `snippet()` when the snippet receives arguments:

```jsx
<Tabs tabs={tabs} panel={snippet((id) => <p>Panel for {id}</p>)} />
```

Do not restyle a component from outside; its CSS is scoped. Compose around it with the tokens and utility classes below.

## Setup

Load `styles.css` (it `@import`s the base reset, element defaults, utilities and syntax mapping, which in turn `@import` the tokens). The default theme is **dark**. Switch themes by setting `data-theme` on a root element:

```html
<div data-theme="light"> … </div>
```

Available themes: `light`, `amoled`, `colorblind`, `dracula`, `everforest`, `everforestlight`, `gruvbox`, `gruvboxlight`, `highcontrast`, `id`, `kanagawalotus`, `latte`, `mocha`, `monokai`, `nord`, `nordlight`, `onedark`, `rosepine`, `rosepinedawn`, `sepia`, `solarized`, `solarizedlight`, `tokyoday`, `tokyonight`, `x` (default = dark, no attribute). Each `[data-theme]` block flips palette tokens only; everything downstream is unchanged.

## The styling idiom — use these tokens, don't invent values

Style with `var(--…)` tokens (inline, or via your own classes). The spacing scale is **not contiguous**: only `--sp-0 1 2 3 4 5 6 8 10 12` exist — there is no `--sp-7`, `--sp-9` or `--sp-11`.

| Concern | Tokens |
|---|---|
| Surfaces | `--bg`, `--bg-elevated`, `--bg-elevated-2`, `--surface` |
| Borders | `--border`, `--border-strong` |
| Text | `--text`, `--text-muted`, `--text-faint` |
| Text on fills | `--text-on-accent`, `--text-on-success` |
| Accent / brand | `--accent`, `--accent-dim` |
| Status | `--ok`, `--info`, `--warn`, `--danger`, `--link` |
| Role colors | `--role-user`, `--role-assistant`, `--role-system`, `--role-tool`, `--role-mcp`, `--role-boundary` |
| Spacing | `--sp-0`, `--sp-1`…`--sp-6`, `--sp-8`, `--sp-10`, `--sp-12` |
| Radius | `--r-sm`, `--r-md`, `--r-lg`, `--r-pill` |
| Font size | `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-md`, `--fs-lg`, `--fs-xl`, `--fs-2xl` (`--fs-scale` scales the set) |
| Font weight | `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold` |
| Line height | `--lh-tight`, `--lh-normal` |
| Font family | `--font-sans`, `--font-mono` |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Layout | `--content-max`, `--header-h`, `--nav-h` |
| Control height | `--control-height`, `--control-height-compact`, `--control-height-default`, `--control-height-large` |
| Square controls | `--box-xs`, `--box-sm`, `--box-md`, `--box-lg`, `--touch-target` |
| Stacking | `--z-header`, `--z-nav`, `--z-drawer`, `--z-modal`, `--z-toast` |
| Safe area | `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` |
| Motion | `--ease` |
| Markdown output | `--md-text`, `--md-heading`, `--md-strong`, `--md-code`, `--md-code-bg` |
| Syntax highlight | `--syn-keyword`, `--syn-string`, `--syn-number`, `--syn-function`, `--syn-comment`, `--syn-punct` |

## Utility classes

`utilities.css` ships a small set of global, content-agnostic helpers. Use these rather than re-deriving them; anything not listed here does **not** exist (the Svelte components' own styling is scoped and is not reachable from a design).

| Family | Classes |
|---|---|
| Layout | `.container` (max-width + safe-area gutters), `.stack` (column flex, `--sp-3` gap), `.row` (centered row, `--sp-2` gap), `.row-wrap`, `.spacer` (flex fill) |
| Text | `.faint` (retintable via `--faint-color`), `.mono`, `.truncate`, `.nowrap` |
| Container queries | `.cq` (opt a box in), then on descendants: `.cq-hide`, `.cq-stack`, `.cq-truncate` (≤30rem), `.cq-hide-xs` (≤18rem) |
| Misc | `.icon` (1em square; also applies to `svg[aria-hidden="true"]`), `.divider`, `.sr-only` |

Highlighted code needs no extra work: `syntax.css` themes the standard **highlight.js** (`.hljs-*`) and **Prism** (`.token.keyword`, `.token.string`, …) class names against the `--syn-*` tokens, so markup from either highlighter is styled on load.

## Where the truth lives

Read `styles.css` → `app.css`, which pulls in `variables.css` (a 2-line re-export of `tokens.css` + `themes.css`), `reset.css`, `utilities.css` and `syntax.css`. **`tokens.css` is the `:root` contract — the single source of truth for token names**; `themes.css` holds the built-in `[data-theme]` palette blocks. `tokens/` holds the same two files copied out for quick reference. Component cards live in `components/`.

## Example

```jsx
<div className="container stack">
  <Card>
    <div className="row">
      <strong style={{ color: 'var(--accent)' }}>Hello</strong>
      <span className="spacer" />
      <span className="faint">muted trailing note</span>
    </div>
    <Button variant="primary" size="sm">Confirm</Button>
  </Card>
</div>
```

---

*The components here are the production Svelte 5 components, bridged to React for design iteration.*
