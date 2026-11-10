# Migrating to Tsumikit 0.83

0.83 makes the calm layout the default: placeholders the size of the content, 44px touch
targets on phones, toasts that stay clear of bottom bars. The API is only added to; nothing was
removed or renamed. What can look different, and how to revert it:

| Change | Revert or adapt |
|---|---|
| On `(pointer: coarse)`, `--control-height-default`, `--box-md` and `--box-lg` are 44px (were 40px): md Buttons, IconButtons, Inputs, Selects, Tabs and boxed controls are 4px taller on phones. sm stays 32px. | Set the tokens on a container for a dense region: `.player { --control-height-default: 2.5rem; --box-md: 2.5rem; }`. |
| On `(pointer: coarse)`, `--touch-target-compact` is 44px (was 40px): compact slabs (sm Buttons, Toggle, Switch, Link, Checkbox, SegmentedControl items) reach 44px, and `Input size="sm"` grows to 44px. | `hitArea="compact"` (`.hit-compact`) for a deliberate small target. App-level tap-target patches that add their own `::before` slabs or `min-height: 44px` to kit controls can be deleted. |
| `Skeleton` without `height` fills the text line box (`1lh` per line, ~1em bar, no gap) instead of 1em bars with an `--sp-2` gap. | Pass `height="1em"` to keep the old bars. Prefer deleting hand-picked heights: `lines={3}` now matches three lines of the text. |
| `DataTable loading` with no rows shows `loadingRows` (5) skeleton rows instead of a "Loading…" text row; `loadingLabel` is announced, not shown. With rows, the trailing loading row is a skeleton row. `data-part="loading"` is gone (`data-part="skeleton"`). | Set `loadingRows` to the expected page size. CSS that targeted `tr[data-part="loading"]` should target `tr[data-part="skeleton"]`. |
| `Toaster` sits above the `TabBar` (`--tabbar-h`) and the DataTable selection bar. | Nothing to do. Add an app bottom bar with `:root { --toaster-offset: var(--player-h, 0px) }`. |
| `TabBar` no longer writes `--tabbar-h: 0px` before it is measured; a CSS default holds the bar height from the first frame. | Hide the bar by not rendering it, not with `display: none`. |

New, opt-in:
- `DataTable actions` (`RowAction[]`: one inline icon button, the rest in a "…" menu, at most one inline on touch), `inlineActions`, and selection mode (`selectable`, `bind:selected`, `bind:selecting`, `selectionActions`) with a floating selection bar that publishes `--selectionbar-h`.
- `FilterChips` for list filters (counts, edge fade only where chips are hidden, dropdown-chip form when they do not fit, `multiple`, `href`).
- `Skeleton aspect="2/3"` and `Skeleton control`.
- `Toaster placement` (`bottom` | `bottom-start` | `bottom-end` | `top`) and `--toaster-offset` / `--toaster-offset-top`.
- `Menu pressed` tints a `variant="toggle"` trigger.

See [patterns.md](patterns.md): reserve the final box, row actions and selection, one control per
kind of choice.
