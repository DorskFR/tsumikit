# design-sync notes — tsumikit

## Shape: off-script. The project is a HYBRID, not CSS-only.

The claude.ai/design project `a4c6ceb9` contains two independently-owned halves:

| Half | Owner | Synced from repo? |
|---|---|---|
| Styling layer — `styles.css`, `app.css`, `variables.css`, `tokens.css`, `themes.css`, `reset.css`, `utilities.css`, `syntax.css`, `tokens/*` | **this repo** (`dist/styles/`) | yes — source of truth |
| 17 React mirror components (`components/**`, `_ds_bundle.js`, `_ds_manifest.json`, `showcase.html`, `fonts/`, `_adherence.oxlintrc.json`, `tokens/Typography.html`) | **the Design project** | **no — hand-written there** |

**Never let a sync delete the second half.** It does not exist in this repo and
cannot be regenerated from it. Upload the styling layer with `deletes: []`.
(The June config claimed "CSS-only trial sync"; that was already false by
2026-09-05 — the React mirrors were added in the project afterwards and the
local config was never updated. This table is the corrected record.)

- tsumikit is **Svelte 5**; the design runtime renders **React** from
  `window.Tsumikit_a4c6ce`. The bundled converter (`package-build.mjs`, esbuild +
  `@types/react`) does not apply. `shape: "package"` in config.json is a placeholder.
- Bundle is assembled by hand from `dist/styles/` (run `npm run package` first;
  `dist/` is gitignored). Closure:
  `styles.css` → `app.css` → {`variables.css` → {`tokens.css`, `themes.css`},
  `reset.css`, `utilities.css`, `syntax.css`}, plus `tokens/` reference copies of
  all three of `tokens.css`, `themes.css`, `variables.css`.
- No `_ds_sync.json` is produced (the anchor recipe belongs to the converter), so
  every re-sync re-verifies from scratch. Correct, not a bug.
- No `@font-face` in the repo's CSS: `--font-sans`/`--font-mono` are system stacks.
  The project's `fonts/JetBrainsMono-Regular.ttf` belongs to the React half.

## The React mirrors have already drifted from the Svelte source

They are **reimplementations**, not extractions. `Button.jsx` defines its own
`.tk-btn` / `.tk-btn--primary` vocabulary injected via a `<style>` tag; the Svelte
`Button.svelte` uses `.btn` / `.btn-primary`. Different names, different CSS,
written by hand. The mirror exposes `variant | size | block | loading`; the Svelte
original also has `tone`, `pill`, `chip`, `square`, `box`, `grow`, `shrink`,
`collapseLabel`, `hitArea`, `as`/`href`, `icon`, `iconInline`, `hoverDanger`,
`control`, and a `link` variant. **17 of 63 components are mirrored.**
README.md tells the design agent the mirrors are simplified stand-ins and that the
styling layer is authoritative — keep that caveat if the README is regenerated.

## Verification method (no converter, no render check)

Inline node script: walk every `@import` from `styles.css`, assert each target
exists, assert every `var(--x)` used in the closure is defined in it, then check
every token/class/theme/component name claimed in the README against the built CSS
and the remote `_ds_manifest.json`. Known false positives: `--mh` / `--mach-`
(comment prose) and `--faint-color` (intentional caller-supplied var with a
fallback). `--sp-7/9/11` appear in the README *as counter-examples* — allowlist them.

Last run (2026-09-05): 118 tokens, 17 utility classes, 25 themes, 17 components,
namespace `Tsumikit_a4c6ce` — all verify.

## conventions.md drift fixed 2026-09-05 (styles restructured after the June sync)

- **Was wrong:** `--sp-0…--sp-12` read as contiguous. Real scale is
  `0 1 2 3 4 5 6 8 10 12` — no `--sp-7`, `--sp-9`, `--sp-11`.
- **Was wrong:** "There are **no utility classes**" — `utilities.css` ships 17.
- **Was stale:** theme list named 15; there are 25.
- **Was stale:** "where the truth lives" pointed at `variables.css`, now a 2-line
  re-export; truth is `tokens.css` (`:root`) + `themes.css`.
- **Added:** `--warn`, `--text-on-accent`, `--text-on-success`, `--box-*`,
  `--touch-target`, `--z-*`, `--control-height-*`, `--safe-*`, `--md-*`,
  `--syn-*`, `--ease`, `--fs-scale`; the utility-class table; the highlight.js /
  Prism note; the React-mirror caveat.

## Re-sync risks

- **Deleting the React half is the top risk.** Any reconciliation pass driven by
  the standard skill (`deletes: ["components/**", ...]`) would wipe 17 hand-written
  components with no way to restore them from git. Always `list_files` first.
- **The mirrors drift silently.** Nothing checks them against the Svelte source.
  Every wave that changes a component's props widens the gap, and the design agent
  trusts the mirror. Re-read the drift section above before claiming parity.
- **The styling layer moves independently of token names.** June→September split
  `variables.css` into `tokens.css` + `themes.css` and added `utilities.css` /
  `syntax.css`, invalidating the README's file map. Re-run the closure script every sync.
- **Utility classes are a growing surface** (absent in June, 17 now). If more land,
  the README table must grow or the agent invents its own names.
- **`dist/` is gitignored and can be stale.** Always `npm run package`, then diff
  `dist/styles/*` against `src/lib/styles/*`.

## Open idea: un-scope the Svelte CSS instead of hand-writing React

Measured 2026-09-05: 846 style rules across 63 components; **745 (88%) are already
keyed on real class names** (`.btn`, `.btn-primary`, `.btn-tone-accent`, `.btn-sm`),
39 use `:global()`, 27 use `[data-*]`. The class vocabulary the mirrors are
re-inventing already exists — it is only hidden behind Svelte's `.svelte-<hash>`
scope suffix. Stripping that suffix from the compiled per-component CSS would yield
a global `components.css` usable directly from plain HTML/JSX, covering all 63
components with zero React and zero drift. Caveats: `.btn`/`.row`/`.card` are
collision-prone as globals (needs a prefix), the 39 `:global()` + 27 `[data-*]`
rules need review, and it needs a build step since Svelte only emits that CSS at
compile time.
