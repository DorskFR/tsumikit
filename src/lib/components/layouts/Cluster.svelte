<script lang="ts">
	// Horizontal layout: children in a row with a consistent gap, wrapping onto
	// new lines by default (so it never overflows). Ideal for toolbars, tag
	// rows, button groups. `gap`/`align`/`justify` are any CSS value; set
	// `wrap={false}` to keep one line. Polymorphic via `as`.
	import type { Snippet } from 'svelte';

	// `size` cascades a uniform control tier to descendant controls that honour the
	// shared `--control-height` contract (Button/IconButton/Popover `control`,
	// SegmentedControl/Select `control`), so a whole toolbar lines up from one prop
	// instead of per-child sizing. `grow` makes direct children share the row width
	// equally (flex: 1) — the toolbar equivalent of `style="flex:1"` on each child.
	const CONTROL_TIER = {
		sm: 'var(--control-height-compact)',
		md: 'var(--control-height-default)',
		lg: 'var(--control-height-large)'
	} as const;

	let {
		as = 'div',
		gap = 'var(--sp-2)',
		align = 'center',
		justify,
		wrap = true,
		size,
		grow = false,
		class: klass = '',
		children,
		...rest
	}: {
		as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'header' | 'footer';
		gap?: string;
		align?: string;
		justify?: string;
		wrap?: boolean;
		size?: 'sm' | 'md' | 'lg';
		grow?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	data-tsu="Cluster"
	class="cluster-c {klass}"
	class:cluster-grow={grow}
	style:gap
	style:align-items={align}
	style:justify-content={justify}
	style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
	style:--control-height={size ? CONTROL_TIER[size] : undefined}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.cluster-c {
		display: flex;
	}
	.cluster-grow > :global(*) {
		flex: 1 1 0;
		min-width: 0;
	}
</style>
