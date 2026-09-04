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

## DONE: the design project now runs the REAL components (2026-09-05)

`npm run design:bundle` + `npm run design:verify`. The 17 hand-written React
mirrors and `showcase.html` were deleted from the project; all **63** exported
components now render from the actual compiled Svelte via `@dorsk/kakehashi`.

Layout uploaded: `_ds_bundle.js` (IIFE on `window.Tsumikit_a4c6ce`, `@ds-bundle`
header), `_ds_bundle.css` (105kB of REAL scoped component CSS, `@import`ed from
`styles.css` — designs only receive that closure), `_vendor/react{,-dom}.js`,
and `components/<Group>/<Name>/{.jsx,.d.ts,.prompt.md,.html}` in
Atoms/Molecules/Layouts/Organisms.

Kept deliberately: `tokens/Typography.html` (pure token card, no React) and
`fonts/JetBrainsMono-Regular.ttf`. **Note:** no `@font-face` declares that font
anywhere in the CSS, so the Typography card's "self-hosted" claim is aspirational
— `--font-mono` only picks it up if the viewer's OS has it installed.

### Build gotchas specific to THIS bundle

1. **One React instance.** `_vendor/react-dom.js` must resolve `react` to
   `window.React`, not bundle its own — two copies leave the hooks dispatcher
   null (`Cannot read properties of null (reading 'useState')`) and every
   component renders empty with no error.
2. **`globalName` + footer, not a dotted global.** esbuild's dotted globalName
   emits `var window;`, shadowing the real window. Use a plain global plus
   `footer: 'window.X = X'`.
3. **Export discovery must match multi-line blocks.** `src/lib/index.ts` exports
   many components as `export {\n default as X,\n type Y,\n} from '...'`. A
   single-line regex silently found only 52 of 63.
4. `$lib` is a SvelteKit alias esbuild needs told about (`alias` option).
5. `card-props.json` drives the preview cards. `propsExpr` is raw JS for props
   JSON cannot express — `DataTable.rowKey` is `(row) => string`.

### Known limitation

`Tabs` declares `panel: Snippet<[string]>` — a REQUIRED Svelte snippet. It is the
only component in the kit that does. kakehashi passes React children as the
default snippet but does not support named snippets yet, so the Tabs card renders
the tab bar without a panel. Fixing it means adding named-snippet support to
kakehashi.

## Background: how the bridge was proven (2026-09-05)

Supersedes the un-scoping idea below. The design runtime is React-only (the
design-sync skill mentions React 234 times, Svelte zero, and exposes no non-React
hook), but its contract is just *"an IIFE assigning every export to
`window.<globalName>`, which the agent renders as JSX"* — it does not care how a
component is implemented inside.

So: a **generic React->Svelte bridge**, written once (~40 lines), wraps any Svelte 5
component as a React one. Not a port — it ships the real compiled Svelte with its
real scoped CSS. Prototype lives in `.ds-proto/` (gitignored): `bridge.jsx`,
`props.svelte.js`, `build.mjs`, `one.mjs`, `sweep.sh`.

Three Svelte 5 APIs make it work (all present in svelte 5.56.3):
- `mount` / `unmount` — mount into a DOM node from plain JS
- `createRawSnippet` — turns a DOM node into a snippet, so React `children` (via
  `createPortal`) become Svelte children
- `compile(..., { css: 'external' })` — emits the real scoped CSS as a stylesheet

### Verified results

Real `Button.svelte`, 7/7: renders a `<button>`; real scoped classes
(`btn svelte-1eyq09g btn-primary btn-sm`); React children inside it; prop changes
reactive with NO remount (same DOM node); `loading` -> disabled + spinner; clean
unmount. The element's scope hash is present in the emitted CSS, so **the real
scoped CSS ships and applies** — no un-scoping, no drift.

Full sweep of all 52 public components (each in its own process, `sweep.sh`):
**51/52 mount and render**. 87KB of genuine component CSS emitted.

### Build gotchas (each cost a debugging cycle — do not rediscover)

1. **Exactly ONE Svelte runtime in the bundle.** Two copies (e.g. a nested
   `node_modules/svelte`) -> `effect_orphan` on mount. Symptom: esbuild-renamed
   `user_effect2` / `validate_effect2` in the stack trace.
2. **`verbatimModuleSyntax: true`** when stripping TS from `<script lang="ts">`.
   Without it esbuild drops imports unused *in the script block* — but Svelte uses
   component imports in the TEMPLATE. Caused 16 `X is not defined` failures.
3. **`define: {'import.meta.env.DEV':'false', ...}`** — the source has Vite-isms a
   plain esbuild bundle does not provide.
4. Some `.svelte.js` stores touch `localStorage` at import time -> the bundle needs
   a browser context (fine in the real runtime; jsdom needs a `url`).
5. `.svelte.js` runes modules need `compileModule` — esbuild-svelte only handles
   `.svelte`. Ten-line esbuild plugin.

### Known issue, NOT caused by the bridge

`ResizablePanel` throws `effect_update_depth_exceeded` on mount. **Verified it does
this under a plain `mount()` with no React and no bridge**, so it is pre-existing.
It is NOT explained by jsdom's missing layout — tested with a stubbed 800px
`getBoundingClientRect` and it loops identically. Needs investigating in a real
browser; it has 6 `$effect`s and reads `getBoundingClientRect()` / `window.innerWidth`.

### Remaining work to productionize (~1 day)

Codegen the 52 wrappers from `src/lib/index.ts`, the esbuild config above emitting
`_ds_bundle.js` (IIFE, globalName) + `_ds_bundle.css`, `@import` that CSS from
`styles.css` (rendered designs only receive that closure), and per-component
`.d.ts` + preview cards. Replaces the 17 hand-written mirrors with all 52 real
components and removes the drift problem permanently.

Test-harness note: jsdom needs polyfills the real runtime already has —
`matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollIntoView`,
`animate`, `<dialog>.showModal/close`, and window methods bound as globals
(`addEventListener` lives on the prototype, so a plain own-property copy misses it).
Components with required props (`Artwork.alt`, `Kbd.keys`, `Truncate.text`/`max`)
must be given them or they fail for reasons unrelated to the bridge.

## Superseded idea: un-scope the Svelte CSS instead of hand-writing React

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
