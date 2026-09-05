<script lang="ts">
	// Intrinsically responsive grid: columns are at least `min` wide and fill the
	// row, wrapping when they can't — no media or container queries needed, so it
	// adapts to whatever space it's given (including inside a narrow column). This
	// is the "columns just adapt to available space" layout from the AppShell
	// demo, as a named component. `min` is the minimum column width, `gap` the
	// gutter. `maxCols` optionally caps how many columns the grid will ever show:
	// it raises the effective per-column minimum to the width N columns would
	// need, so auto-fit can never pack more than N across.
	//
	// `max` caps each column's width: instead of growing to fill the row (the
	// default `1fr`), columns top out at `max` and the grid left-packs them
	// (auto-fill + justify-content:start) so a 3-item and a 4-item section both
	// show uniform fixed-width columns rather than stretching to fill. Beware:
	// auto-fill counts tracks by a definite `max`, so column count only grows
	// when another `max`-wide track fits — a narrow container can end up with
	// one capped column and dead space. `fill` keeps empty tracks (auto-fill)
	// without capping width: tracks are counted by `min`, so density rises
	// monotonically with space and sparse rows don't stretch to fill. `align`
	// controls cross-axis alignment of items within their row; it defaults to
	// `start` so cards don't stretch to the tallest sibling.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		min = '14rem',
		max,
		fill = false,
		gap = 'var(--sp-4)',
		maxCols,
		template,
		align = 'start',
		justify,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol';
		min?: string;
		/** Maximum column width. When set, columns stop growing at this width and
		 * the grid left-packs uniform tracks instead of stretching to fill. */
		max?: string;
		/** Keep empty tracks (auto-fill) without capping column width: columns are
		 * counted by `min`, so count grows monotonically with available space and
		 * sparse rows don't stretch to fill. Ignored when `max` is set. */
		fill?: boolean;
		gap?: string;
		maxCols?: number;
		/** Explicit `grid-template-columns` (e.g. `1fr 1fr auto`); bypasses `min`/`max`. */
		template?: string;
		/** Cross-axis alignment of items in their row (align-items). Defaults to `start`. */
		align?: 'start' | 'center' | 'end' | 'stretch';
		/** Inline (main-axis) distribution of tracks (justify-content). Defaults to
		 * `start` when `max` is set, otherwise the grid's natural `stretch`. */
		justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	// Columns grow to fill (`1fr`) by default; when `max` is given they cap there.
	let track = $derived(max != null ? max : '1fr');
	// auto-fill keeps capped tracks from stretching to fill the row; auto-fit
	// (the default) collapses empty tracks so columns expand to use the space.
	let mode = $derived(max != null || fill ? 'auto-fill' : 'auto-fit');
	// Left-pack capped grids by default so columns don't drift to fill the row.
	let justifyValue = $derived(justify ?? (max != null ? 'start' : null));

	let style = $derived(
		[
			`--ag-min: ${min}`,
			`--ag-track: ${track}`,
			`--ag-mode: ${mode}`,
			maxCols != null ? `--ag-gap: ${gap}` : null,
			maxCols != null ? `--ag-cols: ${maxCols}` : null,
			template ? `grid-template-columns: ${template}` : null,
			`gap: ${gap}`,
			`align-items: ${align}`,
			justifyValue ? `justify-content: ${justifyValue}` : null
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

<svelte:element
	this={as}
	data-tsu="AutoGrid"
	class="autogrid-c {klass}"
	class:capped={maxCols != null}
	{style}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.autogrid-c {
		display: grid;
		grid-template-columns: repeat(var(--ag-mode), minmax(min(100%, var(--ag-min)), var(--ag-track)));
	}

	/* Cap at N columns: the per-column floor becomes the larger of `min` and the
	   width each column gets when N share the row (minus the N-1 gaps), so
	   auto-fit stops adding tracks once N fit. `min(100%, …)` keeps it from
	   overflowing when the container is narrower than a single `min` track. */
	.autogrid-c.capped {
		grid-template-columns: repeat(
			var(--ag-mode),
			minmax(
				min(100%, max(var(--ag-min), (100% - (var(--ag-cols) - 1) * var(--ag-gap)) / var(--ag-cols))),
				var(--ag-track)
			)
		);
	}
</style>
