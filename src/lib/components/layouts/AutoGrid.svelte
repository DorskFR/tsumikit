<script lang="ts">
	// Intrinsically responsive grid: columns are at least `min` wide and fill the
	// row, wrapping when they can't — no media or container queries needed, so it
	// adapts to whatever space it's given (including inside a narrow column). This
	// is the "columns just adapt to available space" layout from the AppShell
	// demo, as a named component. `min` is the minimum column width, `gap` the
	// gutter. `maxCols` optionally caps how many columns the grid will ever show:
	// it raises the effective per-column minimum to the width N columns would
	// need, so auto-fit can never pack more than N across.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		min = '14rem',
		gap = 'var(--sp-4)',
		maxCols,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol';
		min?: string;
		gap?: string;
		maxCols?: number;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	let style = $derived(
		maxCols != null
			? `--ag-min: ${min}; --ag-gap: ${gap}; --ag-cols: ${maxCols}; gap: ${gap}`
			: `--ag-min: ${min}; gap: ${gap}`
	);
</script>

<svelte:element
	this={as}
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ag-min)), 1fr));
	}

	/* Cap at N columns: the per-column floor becomes the larger of `min` and the
	   width each column gets when N share the row (minus the N-1 gaps), so
	   auto-fit stops adding tracks once N fit. `min(100%, …)` keeps it from
	   overflowing when the container is narrower than a single `min` track. */
	.autogrid-c.capped {
		grid-template-columns: repeat(
			auto-fit,
			minmax(
				min(100%, max(var(--ag-min), (100% - (var(--ag-cols) - 1) * var(--ag-gap)) / var(--ag-cols))),
				1fr
			)
		);
	}
</style>
