<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	// Standalone hairline between two siblings. Horizontal by default; the
	// vertical form stretches to the flex parent's cross size. With `children`
	// the rule splits around a centred label ("or", "3 older messages") — a
	// labelled divider is never decorative, so it keeps role="separator".
	type Own = {
		orientation?: 'horizontal' | 'vertical';
		/** Margin along the axis (any CSS length). */
		spacing?: string;
		tone?: 'default' | 'strong' | 'faint';
		/** Centred label turning the rule into rule + text. */
		children?: Snippet;
		/** Purely visual (aria-hidden) rather than a semantic separator. */
		decorative?: boolean;
		class?: string;
	};
	let {
		orientation = 'horizontal',
		spacing,
		tone = 'default',
		children,
		decorative = false,
		class: klass = '',
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLDivElement>, keyof Own> & Own = $props();

	const vertical = $derived(orientation === 'vertical');
	const inline = $derived(spacing ? `margin-${vertical ? 'inline' : 'block'}: ${spacing};` : '');
	const semantic = $derived(!decorative || !!children);
</script>

<div
	class="divider {orientation} tone-{tone} {klass}"
	class:labelled={!!children}
	data-tsu="Divider"
	role={semantic ? 'separator' : undefined}
	aria-orientation={semantic ? orientation : undefined}
	aria-hidden={semantic ? undefined : 'true'}
	style={inline + (styleProp ?? '') || undefined}
	{...rest}
>
	{#if children}
		<span class="divider-label">{@render children()}</span>
	{/if}
</div>

<style>
	.divider {
		flex: none;
		border: 0;
	}
	.horizontal {
		width: 100%;
		height: 1px;
		background: var(--border);
		margin-block: var(--sp-3);
	}
	.vertical {
		align-self: stretch;
		width: 1px;
		min-height: 1em;
		background: var(--border);
		margin-inline: var(--sp-3);
	}
	.horizontal.labelled,
	.vertical.labelled {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		background: none;
	}
	.horizontal.labelled {
		height: auto;
	}
	.vertical.labelled {
		flex-direction: column;
		width: auto;
	}
	.horizontal.labelled::before,
	.horizontal.labelled::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}
	.vertical.labelled::before,
	.vertical.labelled::after {
		content: '';
		flex: 1;
		width: 1px;
		background: var(--border);
	}
	.tone-strong:not(.labelled),
	.tone-strong.labelled::before,
	.tone-strong.labelled::after {
		background: var(--border-strong);
	}
	.tone-faint:not(.labelled),
	.tone-faint.labelled::before,
	.tone-faint.labelled::after {
		background: color-mix(in srgb, var(--border) 45%, transparent);
	}
	.divider-label {
		min-width: 0;
		color: var(--text-muted);
		font-size: var(--fs-sm);
		text-align: center;
	}
</style>
