# Guardrails

[Back to the README](../README.md)

## Design lint (`tsumikit-lint`)

The package ships a dependency-free CLI that flags drift from the kit's rules in your `.svelte` and `.css` files (it only needs node and the `svelte` peer).

```sh
npx tsumikit-lint            # lints ./src
npx tsumikit-lint src lib/styles/app.css
npx tsumikit-lint --json src # CI-friendly
npx tsumikit-lint --rule spacing-scale,breakpoints src
npx tsumikit-lint --disable no-raw-control src
```

Output is `file:line:col  rule  message` plus a per-rule summary; exit code is 1 when anything is reported, 2 on usage errors.

| Rule | Flags |
| --- | --- |
| `no-raw-color` | hex / rgb / hsl literals outside `:root` / `[data-theme]` blocks (custom-property definitions and `var()`-composed colors are fine) |
| `spacing-scale` | px / rem in padding, margin, gap, inset and top/right/bottom/left that is not a `--sp-*` token; `0` and `1px` hairlines allowed; suggests the token |
| `no-raw-control` | raw `<button>`, `<input>`, `<select>`, `<textarea>` instead of the atoms |
| `one-primary` | more than one `variant="primary"` that can render at the same time (if/else branches are exclusive, snippets are separate) |
| `no-raw-font` | `font-family` other than `var(--font-*)`; `--font-mono` outside code-ish elements (use `--font-numeric` / `--font-label`) |
| `breakpoints` | media-query widths other than 40rem/640px, 48rem/768px, 64rem/1024px (and their max-width complements like 39.999rem / 639.98px) |
| `motion` | `transition` / `@keyframes` on properties other than transform, opacity, color, background-color, box-shadow, filter (and other paint-only properties); `transition: all` |
| `img-alt` | `<img>` without `alt` |

Suppress a single line with a comment on the line above (or at the end of the line):

```css
/* tsumikit-lint-ignore spacing-scale */
padding: 3px;
```
```svelte
<!-- tsumikit-lint-ignore no-raw-control -->
<button type="button" class="chip">…</button>
```

Omit the rule id to ignore every rule on that line. In app code, read the breakpoint list from `breakpoints` in the main entry.

lefthook:

```yaml
pre-commit:
  commands:
    tsumikit-lint:
      glob: '*.{svelte,css}'
      run: npx tsumikit-lint {staged_files}
```

## Dev-mode design warnings

In development, `AppShell` starts a DOM audit (`src/lib/dev-audit.ts`) that console.warns once per issue, prefixed `[tsumikit]`, with the offending element:

- more than one visible primary `Button` in the same `main` or dialog (modal and page are counted separately);
- `Button`/`IconButton` without an accessible name;
- on coarse pointers, interactive elements whose hit box is under `--touch-target` (kit controls are accepted at `--touch-target-compact`; controls carrying the kit's touch slab are not flagged; opt out per element with `.hit-compact`);
- text over an `Artwork`/`img` without a `Scrim` (or any opaque background).

Without `AppShell`: `import { startDesignAudit } from '@dorsk/tsumikit/dev-audit'; startDesignAudit();`. The audit is guarded by `import.meta.env.DEV`, so production bundles contain none of it.
