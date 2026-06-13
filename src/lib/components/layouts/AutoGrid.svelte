<script lang="ts">
	// Intrinsically responsive grid: columns are at least `min` wide and fill the
	// row, wrapping when they can't — no media or container queries needed, so it
	// adapts to whatever space it's given (including inside a narrow column). This
	// is the "columns just adapt to available space" layout from the AppShell
	// demo, as a named component. `min` is the minimum column width, `gap` the
	// gutter.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		min = '14rem',
		gap = 'var(--sp-4)',
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol';
		min?: string;
		gap?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element this={as} class="autogrid-c {klass}" style="--ag-min: {min}; gap: {gap}" {...rest}>
	{@render children?.()}
</svelte:element>

<style>
	.autogrid-c {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ag-min)), 1fr));
	}
</style>
