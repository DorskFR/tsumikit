# Showcase examples

`src/demo/` is the component showcase rendered by `src/routes/+page.svelte`. It is not packaged.
The nav, sections and snippets are generated from the file tree: adding a component never
touches a shared file.

## Add a component

Create `src/demo/<family>/<Component>/` where `<family>` is `atoms`, `molecules`, `organisms`,
`layouts` or `foundations` (topics such as `Typography`, `ThemeTokens`), and `<Component>` is the
exported name (`SegmentedControl`). The section id is the kebab-cased directory name
(`#segmented-control`).

```
src/demo/molecules/SegmentedControl/
  meta.ts
  01-Overview.svelte
  02-Variants.svelte
  03-States.svelte
  04-Composition.svelte
```

### `meta.ts`

```ts
import type { ComponentMeta } from '../../framework/registry';

export const meta: ComponentMeta = {
	description: 'One sentence on what the component is for.',
	keywords: ['switcher', 'choice', 'group'],
	seeAlso: ['Tabs', 'RadioGroup'],
	// name: 'Metric / StatTile'  (display name, defaults to the directory name)
	// order: 1                   (sort key inside the family, alphabetical by default)
};
```

`keywords`, `description`, name and family all feed the sidebar filter.

### Example files

Each `NN-Title.svelte` is one example: it is rendered live **and** shown verbatim as the snippet,
so there is nothing to keep in sync. The anchor is `#<section>--<title-kebab>`
(`#segmented-control--states`).

```svelte
<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, loading, error and empty.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl } from '@dorsk/tsumikit';
	let view = $state('list');
</script>

<SegmentedControl bind:value={view} options={[...]} />
```

- `title` is required. `caption` is optional and names the props at play.
- `layout`: `row` (default, wrapping flex row) · `stack` (column, children stretch) · `grid`
  (auto-fill columns) · `center` · `frame` (block box; set `height`, scrolls inside). Add
  `resizable: true` for container-query components (a horizontal resize handle on the preview).
- Import from `'@dorsk/tsumikit'`, never `$lib`, so the snippet works when pasted into an app.
- Only the `<script module>` block is stripped from the snippet. Everything else is shown.
- Must prerender: no `window`, `document` or `localStorage` outside `$effect` / `onMount`.
- Self-contained: state lives in the file. Shared realistic data is in `src/demo/fixtures`
  (people, services, files, tracks, messages, providers); import it as
  `'../../fixtures'`. Lane-specific data stays inside the component directory.

### Quality bar

1. `01-Overview`: a realistic in-context use (a settings form, an ops dashboard row, a player, a
   chat), never `Option one / Option two`.
2. `02-Variants`: variants, tones and sizes as a compact labelled grid.
3. `03-States`: disabled, loading, error, empty, long content and overflow.
4. Composition with sibling components where natural.
5. Keep the legacy page's prop-matrix rigour (tone matrices, overflow fixtures) as a final
   `NN-Matrix.svelte` when it is worth keeping as a regression fixture.

Labels describe intent; prop names go in the caption. Every component in `src/lib/index.ts` needs
a `meta.ts` and at least two examples (`tests/demo-coverage.test.js`).

## Framework

`src/demo/framework/` owns the shell: `DemoShell` (AppShell, filter, scrollspy, hash redirects),
`DemoNav`, `DemoToolbar` (theme and font scale pickers, an `extras` snippet slot for global
controls), `DemoSection`, `Example`, `registry.ts` (the globs), `highlight.ts`, `catalog.ts`
(the full component list used for not-yet-migrated stubs and legacy anchor redirects).
Family lanes never edit it.
