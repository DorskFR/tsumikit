<script lang="ts">
	// Centered, max-width content column with token gutters that respect safe-area
	// insets. `size` overrides the default --content-max; `pad` toggles vertical
	// padding. Polymorphic via `as` so it can be a <main>, <section>, etc.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		size,
		pad = false,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'main' | 'section' | 'article';
		/** Max width (any CSS length). Defaults to --content-max. */
		size?: string;
		pad?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	class="container ct {klass}"
	class:pad
	style={size ? `max-width: ${size}` : undefined}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.ct.pad {
		padding-top: var(--sp-6);
		padding-bottom: var(--sp-12);
	}
</style>
