# tsumikit — design tokens (CSS-only trial sync)

tsumikit is a **Svelte 5 + pure-CSS** UI kit. The live components are Svelte and cannot render in this design runtime, so **only the styling layer is synced**: the theme tokens and base element styles. Build with plain HTML/JSX elements and style them with the tokens below — every visual value in the kit is a `var(--…)` token, no component hard-codes a color or size.

## Setup

Load `styles.css` (it `@import`s the base reset + element defaults, which in turn `@import` the tokens). The default theme is **dark**. Switch themes by setting `data-theme` on a root element:

```html
<div data-theme="light"> … </div>
```

Available themes: `light`, `amoled`, `colorblind`, `dracula`, `everforest`, `gruvbox`, `highcontrast`, `mocha`, `monokai`, `nord`, `onedark`, `rosepine`, `sepia`, `solarized`, `tokyonight` (default = dark, no attribute). Each `[data-theme]` block flips palette tokens only; everything downstream is unchanged.

## The styling idiom — use these tokens, don't invent values

There are **no utility classes**. Style with inline `var(--…)` tokens (or your own classes that reference them).

| Concern | Tokens |
|---|---|
| Surfaces | `--bg`, `--bg-elevated`, `--bg-elevated-2`, `--surface` |
| Borders | `--border`, `--border-strong` |
| Text | `--text`, `--text-muted`, `--text-faint` |
| Accent / brand | `--accent`, `--accent-dim` |
| Status | `--ok`, `--info`, `--danger`, `--link` |
| Role colors | `--role-user`, `--role-assistant`, `--role-system`, `--role-tool`, `--role-mcp`, `--role-boundary` |
| Spacing | `--sp-0`…`--sp-12` |
| Radius | `--r-sm`, `--r-md`, `--r-lg`, `--r-pill` |
| Font size | `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-md`, `--fs-lg`, `--fs-xl`, `--fs-2xl` |
| Font weight | `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold` |
| Line height | `--lh-tight`, `--lh-normal` |
| Font family | `--font-sans`, `--font-mono` |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Layout | `--content-max`, `--control-height`, `--header-h`, `--nav-h` |

## Where the truth lives

Read `styles.css` → `app.css` (base reset + element defaults) → `variables.css` (all tokens, the single source of truth). `tokens/variables.css` is the same token file for quick reference.

## Example

```jsx
<div style={{
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  padding: 'var(--sp-4)',
  color: 'var(--text)',
  font: 'var(--fs-base)/var(--lh-normal) var(--font-sans)',
}}>
  <strong style={{ color: 'var(--accent)' }}>Hello</strong>
</div>
```
