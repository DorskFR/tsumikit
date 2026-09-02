<script lang="ts">
	// Heading primitive: the ONLY place an <h1>–<h6> is emitted. `level` picks both
	// the semantic tag and the default display size; `size` overrides the visual
	// size independently of the level (e.g. toolbar chrome pinned smaller than its
	// heading rank). All sizes/weights/colours come from theme tokens.
	import type { Snippet } from 'svelte';

	type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

	let {
		level = 2,
		size,
		tone = 'default',
		truncate = false,
		italic = false,
		nowrap = false,
		wrap = 'normal',
		uppercase = false,
		leading,
		measure,
		grow = false,
		scale = true,
		class: klass = '',
		children,
		...rest
	}: {
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		size?: Size;
		tone?: 'default' | 'muted' | 'faint';
		truncate?: boolean;
		italic?: boolean;
		nowrap?: boolean;
		wrap?: 'normal' | 'anywhere' | 'balance';
		uppercase?: boolean;
		leading?: 'tight' | 'normal' | 'none';
		// CSS max-width for the line measure, e.g. "40ch".
		measure?: string;
		grow?: boolean;
		// false pins the size to its unscaled px value, ignoring --fs-scale.
		scale?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	// Default display size per rank (h1 biggest). `size` overrides it.
	const DEFAULT_SIZE: Record<number, Size> = { 1: '2xl', 2: 'xl', 3: 'lg', 4: 'md', 5: 'sm', 6: 'xs' };
	const fs = $derived(size ?? DEFAULT_SIZE[level]);
	const styleAttr = $derived(measure ? `max-width: ${measure}` : undefined);
</script>

<svelte:element
	this={`h${level}`}
	data-tsu="Heading"
	class="heading fs-{fs} tone-{tone} {leading ? `lh-${leading}` : ''} {wrap !== 'normal' ? `wrap-${wrap}` : ''} {klass}"
	class:truncate
	class:italic
	class:nowrap
	class:uppercase
	class:grow
	class:noscale={!scale}
	style={styleAttr}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	.heading {
		margin: 0;
		font-weight: var(--fw-semibold);
		line-height: var(--lh-tight);
		color: var(--text);
	}
	.tone-muted {
		color: var(--text-muted);
	}
	.tone-faint {
		color: var(--text-faint);
	}
	.fs-xs {
		font-size: var(--fs-xs);
	}
	.fs-sm {
		font-size: var(--fs-sm);
	}
	.fs-md {
		font-size: var(--fs-md);
	}
	.fs-lg {
		font-size: var(--fs-lg);
	}
	.fs-xl {
		font-size: var(--fs-xl);
	}
	.fs-2xl {
		font-size: var(--fs-2xl);
	}
	.noscale.fs-xs {
		font-size: 12px;
	}
	.noscale.fs-sm {
		font-size: 13px;
	}
	.noscale.fs-md {
		font-size: 16px;
	}
	.noscale.fs-lg {
		font-size: 18px;
	}
	.noscale.fs-xl {
		font-size: 22px;
	}
	.noscale.fs-2xl {
		font-size: 28px;
	}
	.truncate {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.italic {
		font-style: italic;
	}
	.nowrap {
		white-space: nowrap;
	}
	.wrap-anywhere {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.wrap-balance {
		text-wrap: balance;
	}
	.uppercase {
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.lh-tight {
		line-height: var(--lh-tight);
	}
	.lh-normal {
		line-height: var(--lh-normal);
	}
	.lh-none {
		line-height: 1;
	}
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
</style>
