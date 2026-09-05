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
	// `stackAt` turns the cluster into its own inline-size query container and
	// stacks children full-width once it is narrower than the tier (18/30/40/48rem),
	// for phone action rows; the cluster then no longer shrink-wraps its content.
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
		shrink = true,
		fill = false,
		push,
		wrapAt,
		stackAt,
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
		/** `false` pins the cluster (`flex: none`) inside a parent row. */
		shrink?: boolean;
		/** `height: 100%` to fill a flex parent. */
		fill?: boolean;
		/** Auto margin that pushes the cluster to the start/end of its parent. */
		push?: 'start' | 'end';
		/** Width (px/em/rem) under which the row starts wrapping (wraps always when unset and `wrap`). */
		wrapAt?: string;
		stackAt?: 'xs' | 'sm' | 'md' | 'lg';
		class?: string;
		style?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	let el = $state<HTMLElement | null>(null);
	let narrow = $state(false);
	function toPx(length: string, node: HTMLElement): number {
		const n = Number.parseFloat(length);
		const fontSize = (x: Element) => Number.parseFloat(getComputedStyle(x).fontSize);
		if (length.endsWith('rem')) return n * fontSize(document.documentElement);
		if (length.endsWith('em')) return n * fontSize(node);
		return n;
	}
	$effect(() => {
		if (!wrapAt || !el) {
			narrow = false;
			return;
		}
		const node = el;
		const limit = toPx(wrapAt, node);
		const ro = new ResizeObserver(([entry]) => {
			narrow = entry.contentRect.width < limit;
		});
		ro.observe(node);
		return () => ro.disconnect();
	});
	const wrapping = $derived(wrapAt ? narrow : wrap);
</script>

<svelte:element
	this={as}
	bind:this={el}
	data-tsu="Cluster"
	class="cluster-c {klass}"
	class:cluster-grow={grow}
	class:no-shrink={!shrink}
	class:fill
	class:push-start={push === 'start'}
	class:push-end={push === 'end'}
	class:cluster-stack={stackAt !== undefined}
	class:stack-xs={stackAt === 'xs'}
	class:stack-sm={stackAt === 'sm'}
	class:stack-md={stackAt === 'md'}
	class:stack-lg={stackAt === 'lg'}
	style:gap
	style:align-items={align}
	style:justify-content={justify}
	style:flex-wrap={wrapping ? 'wrap' : 'nowrap'}
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
	.cluster-c > :global([data-grow]) {
		flex: 1 1 0;
		min-width: 0;
	}
	.cluster-c > :global([data-shrink='false']) {
		flex: none;
	}
	.no-shrink {
		flex: none;
	}
	.fill {
		height: 100%;
	}
	.push-start {
		margin-inline-end: auto;
	}
	.push-end {
		margin-inline-start: auto;
	}
	.cluster-stack {
		container-type: inline-size;
	}
	@container (max-width: 18rem) {
		.stack-xs > :global(*) {
			flex: 1 1 100%;
		}
	}
	@container (max-width: 30rem) {
		.stack-sm > :global(*) {
			flex: 1 1 100%;
		}
	}
	@container (max-width: 40rem) {
		.stack-md > :global(*) {
			flex: 1 1 100%;
		}
	}
	@container (max-width: 48rem) {
		.stack-lg > :global(*) {
			flex: 1 1 100%;
		}
	}
</style>
