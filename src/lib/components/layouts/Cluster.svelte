<script lang="ts">
	// Horizontal layout: children in a row with a consistent gap, wrapping onto
	// new lines by default (so it never overflows). Ideal for toolbars, tag
	// rows, button groups. `gap`/`align`/`justify` are any CSS value; set
	// `wrap={false}` to keep one line. Polymorphic via `as`.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		gap = 'var(--sp-2)',
		align = 'center',
		justify,
		wrap = true,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer';
		gap?: string;
		align?: string;
		justify?: string;
		wrap?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	class="cluster-c {klass}"
	style:gap
	style:align-items={align}
	style:justify-content={justify}
	style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.cluster-c {
		display: flex;
	}
</style>
