<script lang="ts">
	// Centered, max-width content column with token gutters that respect safe-area
	// insets. `size` overrides the default --content-max; `pad` toggles vertical
	// padding. `fullWidth` releases the max-width constraint and lets the content
	// bleed to the full viewport width even when nested inside a centered ancestor
	// (the `margin-inline: calc(50% - 50vw)` trick), for edge-to-edge sections.
	// Polymorphic via `as` so it can be a <main>, <section>, etc.
	import type { Snippet } from 'svelte';

	let {
		as = 'div',
		size,
		pad = false,
		fullWidth = false,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'main' | 'section' | 'article';
		/** Max width (any CSS length). Defaults to --content-max. Ignored when `fullWidth`. */
		size?: string;
		pad?: boolean;
		/** Break out to the full viewport width, ignoring `size`/--content-max. */
		fullWidth?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	data-tsu="Container"
	class="container ct {klass}"
	class:pad
	class:full={fullWidth}
	style={!fullWidth && size ? `max-width: ${size}` : undefined}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.ct.pad {
		padding-top: var(--sp-6);
		padding-bottom: var(--sp-12);
	}

	/* Break out of any centered ancestor to span the full viewport width.
	   `margin-inline: calc(50% - 50vw)` pulls each edge out to the viewport,
	   keeping the element in normal flow (no transform/overflow side-effects). */
	.ct.full {
		max-width: none;
		width: 100vw;
		margin-inline: calc(50% - 50vw);
	}
</style>
