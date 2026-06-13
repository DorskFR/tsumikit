<script lang="ts">
	// Vertical layout: children stacked in a column with a consistent gap.
	// `gap`/`align`/`justify` accept any CSS length/value; `gap` defaults to a
	// spacing token. Polymorphic via `as`. The one-dimensional layout every app
	// rebuilds, in one intention-revealing component.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		gap = 'var(--sp-3)',
		align,
		justify,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol' | 'li' | 'form' | 'nav';
		gap?: string;
		align?: string;
		justify?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	class="stack-c {klass}"
	style:gap
	style:align-items={align}
	style:justify-content={justify}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.stack-c {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
</style>
