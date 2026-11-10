# Patterns

[Back to the README](../README.md)

## Calm loading

Every busy indicator in the kit waits 200 ms before appearing and then stays at least 500 ms, so a 60 ms save never flashes a spinner and a slow one never flickers. `Button loading` and `EmptyState loading` do this internally; `aria-busy` and the click block still follow `loading` at once, only the visual is calmed. Tune or disable per instance with `loadingDelay` / `loadingMin` (`0` = immediate). For your own indicators:

```svelte
<script>
  import { pending } from '@dorsk/tsumikit';
  let saving = $state(false);
  const p = pending(() => saving, { delay: 200, min: 500 });
</script>
{#if p.visible}<Spinner />{/if}
```

## Reserve the final box

A placeholder is the size of what replaces it, so nothing moves when data arrives. Render the
section's frame (heading, toolbar, table header) from the first frame and put skeletons only
where the data goes.

- `Skeleton` without `height` fills the line box of the text around it: `lines={3}` is exactly
  three lines tall at that font. `aspect="2/3"` is a cover or tile at its real ratio; `control`
  is a box at the control height, for form rows. An explicit `height` keeps fixed bars.
  Put a text skeleton in a block (`Text as="p"`, a `div`), not an inline span, so it takes
  the block's line height.
- `DataTable loading` with no rows draws `loadingRows` (default 5) skeleton rows in real cells,
  so each one is a data row tall and `hideBelow` / stacked mode apply. Set `loadingRows` to the
  page size you expect. `loadingLabel` is announced; nothing visible says "Loading…".
- `Artwork` reserves its box and shows its placeholder until the image loads.

```svelte
<Card>
	<Heading level={3}>Playback</Heading>
	{#if settings}
		<Field label="Quality"><Select bind:value={settings.quality} {options} /></Field>
		<Field label="Speed"><Select bind:value={settings.speed} {options} /></Field>
	{:else}
		{#each { length: 2 } as _}
			<Skeleton width="30%" />
			<Skeleton control />
		{/each}
	{/if}
</Card>

<AutoGrid min="9rem">
	{#each { length: 12 } as _}
		<div><Skeleton aspect="2/3" /><Skeleton lines={2} /></div>
	{/each}
</AutoGrid>

<DataTable {columns} rows={items ?? []} rowKey={(r) => r.id} loading={!items} loadingRows={25} />
```

## Row actions and selection

One visible action per row; everything else is one tap away. `DataTable actions` takes a list
per row: the first `inlineActions` (default 1) render as icon buttons, the rest go into a "…"
menu, and touch or stacked layouts never show more than one inline. Put the action people
repeat first.

Selection is a mode, not a permanent column: with `selectable`, the checkboxes and the floating
selection bar appear only while `selecting` is true (a "Select" button on the page, or the
"Select" item the row menu gains). The bar floats above the tab bar and pushes nothing; toasts
stack above it.

```svelte
<Button size="sm" pressed={selecting} onclick={() => (selecting = !selecting)}>Select</Button>
<DataTable {columns} {rows} rowKey={(r) => r.id} {actions} selectable bind:selected bind:selecting>
	{#snippet selectionActions(picked)}
		<Button size="sm" onclick={() => search(picked)}>Search {picked.length}</Button>
	{/snippet}
</DataTable>
```

## One control per kind of choice

| Choice | Component |
|---|---|
| Page-level views (Queue / History / Blocklist) | `Tabs` |
| Filters over a list (All 3,047 / Missing 924 / Complete) | `FilterChips` |
| Two-state display toggles (grid / list) | `SegmentedControl`, icon only |

`FilterChips` keeps one row: it scrolls with a fade only on the edge that hides chips and, with
`collapse="auto"` (default), turns into a single dropdown chip ("All 3,047 ▾") when the chips do
not fit. `multiple` makes it a set of toggles; `href` makes the chips links for URL state.

## Undo over confirm

Prefer an optimistic change with an Undo toast to a confirmation dialog when success is likely. `toasts.undo` applies at once, offers Undo while the toast is visible, commits when it goes away (timeout, click, or `pagehide`), and reverts with a plain-words error toast if the commit fails:

```ts
toasts.undo({
  message: 'Message deleted',
  apply: () => (items = items.filter((m) => m.id !== id)),
  revert: () => (items = [...items, removed]),
  commit: () => api.delete(id),
});
```

Keep `ConfirmModal` for irreversible or bulk actions (purging data, deleting many rows, anything that cannot be reverted locally).

## URL state

Put tab, filter and page state in the URL so it survives a refresh and can be shared. `urlState` is a framework-neutral rune for one search param; Tabs, SegmentedControl and Pagination accept `href` and then render real links (middle-click opens in a new tab) with `aria-current`.

```svelte
<script lang="ts">
	import { Tabs, Pagination, urlState } from '@dorsk/tsumikit';
	const tab = urlState('tab', { default: 'overview' });
	const page = urlState('page', { default: 1, parse: Number, serialize: String, push: true });
</script>

<Tabs {tabs} bind:value={tab.value} href={(id) => tab.href(id)} />
<Pagination bind:page={page.value} pageCount={12} href={(p) => page.href(p)} />
```

`urlState(key, { default, parse?, serialize?, push? })` reads the param (or `default`), writes with `history.replaceState` (`pushState` when `push`), follows back/forward, and holds `default` without a `window` (SSR-safe). A value that serializes like the default removes the param. `href(value)` builds the link for the current page with that value. Per-item `href` on `TabItem`/`SegmentOption` overrides the function. `isModifiedClick(e)` is exported for custom links that must leave ctrl/meta/shift/middle clicks to the browser.

## Backdrop

`Backdrop` is the page-level hero: a full-bleed `Artwork` (so a missing or failed
`src` shows the seeded placeholder and the picture fades in lazily) that melts into
`--bg` along its bottom edge, with `children` sitting on a scrim mixed from `--bg`
so titles and actions read over any picture. `height` takes any CSS length
(default `min(45svh, 22rem)`), `fade="none"` keeps a hard edge, `blur` softens the
picture, `dim` tints it toward `--bg`. `seed`, `fallback`, `icon`, `fit`, `srcset`,
`sizes`, `onerror` are passed straight to Artwork; everything else (incl. `aria-*`)
spreads onto the root. Under `prefers-reduced-transparency` the scrim becomes
opaque and the blur is dropped; `prefers-contrast: more` also uses the opaque scrim.

```svelte
<Backdrop as="header" src={album.cover} alt="" seed={album.title} height="18rem">
  <Heading level={1}>{album.title}</Heading>
  <Text tone="muted">{album.artist}</Text>
  <Button variant="primary">Play</Button>
</Backdrop>
```

## Masked spans while typing (Textarea `segments`)

`Textarea` (and `Composer`, which forwards it) accepts `segments`, a function that splits the
current value into spans for a mirror overlay rendered behind a text-transparent native textarea.
Each segment's `text` is rendered verbatim so glyph widths match 1:1; `mask: true` keeps the span's
layout but hides its glyphs under a token fill (`--textarea-mask` overrides it); `class` is added
to the span. The texts must concatenate back to the value. Caret, selection, IME composition, undo,
autoresize and scrolling stay native. The overlay is `aria-hidden`: assistive tech and the form
still get the raw value. Without `segments` the Textarea is a plain native textarea.

```svelte
<script lang="ts">
	import { Textarea } from '@dorsk/tsumikit';
	const TAG = /(<redacted>)([\s\S]*?)(<\/redacted>)/g;
	function segments(text: string) {
		const out = [];
		let last = 0;
		for (const m of text.matchAll(TAG)) {
			if (m.index > last) out.push({ text: text.slice(last, m.index) });
			out.push({ text: m[1], class: 'tag' }, { text: m[2], mask: true }, { text: m[3], class: 'tag' });
			last = m.index + m[0].length;
		}
		if (last < text.length) out.push({ text: text.slice(last) });
		return out;
	}
</script>

<Textarea bind:value autoresize {segments} aria-label="Message" />
```

## Breakpoints

One list for every media query: `sm` 40rem (640px), `md` 48rem (768px), `lg`
64rem (1024px); max-width queries use the complement (`39.999rem`,
`47.999rem`, `63.999rem`). CSS custom properties cannot drive `@media`, so the
list is exported for JS (`breakpoints`, `minWidth(bp)`, `maxWidth(bp)`) with a
reactive, SSR-safe `mq.sm` / `mq.md` / `mq.lg` and `media(query)`.
`tsumikit-lint` enforces the list in CSS. Inside a pane, prefer container
queries ([layout.md](layout.md#container-queries)).
