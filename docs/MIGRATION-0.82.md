# Migrating to Tsumikit 0.82

0.82 changes defaults to follow the [design principles](../principles/README.md). The API is
only added to; nothing was removed or renamed. What can look different, and how to revert it:

| Change | Revert or adapt |
|---|---|
| Inter is bundled and first in `--font-sans` (via `styles/app.css` → `styles/font.css`). | Import `tokens.css` / `themes.css` without `font.css`, or override `--font-sans`. |
| Numbers and labels (`--font-numeric`, `--font-label`) are sans with tabular numerals, not monospace. | `:root { --font-numeric: var(--font-mono); --font-label: var(--font-mono); }` |
| The accent moved off the status colours in 15 palettes (default dark is now sky `#4cc3f0`). | Anything that relied on `--accent` matching `--ok` must read `--ok`. Pin a custom accent with `--c-accent` in your theme block. |
| `--text-faint` is about 3:1, kept for placeholders, disabled and decorative text; kit labels moved to `--text-muted`. | Move any app text people must read from `--text-faint` to `--text-muted`. |
| `Prose` and `EmptyState` descriptions cap at `--measure` (68ch). | `--measure: none` on a container. |
| `Button` / `EmptyState` loading visuals wait 200 ms and stay at least 500 ms; `aria-busy` and the click block still follow `loading` at once. | `loadingDelay={0} loadingMin={0}`. |
| `Modal` and `Button` media queries use the shared list (`40rem`, `39.999rem`). | Same widths at a 16px root; nothing to do. |
| `AppShell` runs a design audit in development and prints `[tsumikit]` warnings. | Fix the flagged element, or add `.hit-compact` for a deliberate small target. Production builds contain none of it. |

New, opt-in: `npx tsumikit-lint`, `toasts.undo()`, `pending()`, `urlState()`, `href` on `Tabs` /
`SegmentedControl` / `Pagination`, `Backdrop`, `breakpoints` / `mq` / `media()`, `Text measure`,
`@dorsk/tsumikit/dev-audit`, and the `principles/` docs.
