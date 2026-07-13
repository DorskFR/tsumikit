<script lang="ts" module>
	export interface SegmentOption {
		value: string;
		/** Visible text. Optional in `icon` mode where the icon carries the meaning. */
		label?: string;
		/** Optional count badge rendered after the label (filter-pill use). */
		count?: number;
		/** Icon glyph — required for icon-toggle mode, optional alongside a label. */
		icon?: import('$lib/components/atoms/Icon.svelte').IconName;
		/** Greyed out, not selectable, skipped by keyboard navigation. */
		disabled?: boolean;
	}
</script>

<script lang="ts">
	// Single-select segmented control. One token-driven row of options covering
	// the two repeated redesign controls:
	//   • filter pills  — label + optional count badge ("All 742 / Missing 120")
	//   • view toggle   — compact icon-only buttons (grid / list)
	// Implemented with `radiogroup`/`radio` semantics + roving tabindex so the
	// browser-free keyboard model matches Tabs: ←/→ and Home/End move selection,
	// Space/Enter (or click) activate. `value` is bindable.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import { nextEnabledSegment } from './segmented-control-keyboard.js';

	let {
		options,
		value = $bindable(),
		// `icon` packs the segments into compact square buttons (label hidden as an
		// accessible name only); `pill` keeps the labelled filter-pill layout.
		variant = 'pill',
		size = 'md',
		label = 'Options',
		// `mobile` hides segment labels below the mobile breakpoint, collapsing
		// labelled segments to centered icon-only squares (aria-label preserved).
		collapseLabels = 'never',
		class: klass = '',
		// Custom rendering per option (overrides the built-in label/count/icon).
		option: optionSnippet
	}: {
		options: SegmentOption[];
		value?: string;
		variant?: 'pill' | 'icon';
		size?: 'sm' | 'md';
		label?: string;
		collapseLabels?: 'never' | 'mobile';
		class?: string;
		option?: Snippet<[SegmentOption, boolean]>;
	} = $props();

	// Default to the first selectable option when no value is supplied.
	$effect(() => {
		if (value === undefined) {
			const first = options.find((o) => !o.disabled);
			if (first) value = first.value;
		}
	});

	let listEl = $state<HTMLDivElement | null>(null);
	const baseId = `seg-${Math.random().toString(36).slice(2, 8)}`;

	function select(val: string, focus = false) {
		if (options.find((o) => o.value === val)?.disabled) return;
		value = val;
		if (focus) {
			queueMicrotask(() =>
				listEl?.querySelector<HTMLButtonElement>(`#${baseId}-${val}`)?.focus()
			);
		}
	}
	function onkeydown(e: KeyboardEvent) {
		const i = options.findIndex((o) => o.value === value);
		const next = nextEnabledSegment(options, i, e.key);
		if (next === undefined) return;
		e.preventDefault();
		select(options[next].value, true);
	}
</script>

<div
	bind:this={listEl}
	role="radiogroup"
	aria-label={label}
	tabindex="-1"
	class="seg seg-{variant} seg-{size} {klass}"
	class:seg-collapse-mobile={collapseLabels === 'mobile'}
	data-tsu="SegmentedControl"
	{onkeydown}
>
	{#each options as o (o.value)}
		{@const selected = value === o.value}
		<button
			type="button"
			id="{baseId}-{o.value}"
			role="radio"
			aria-checked={selected}
			aria-label={variant === 'icon' && !o.label ? o.value : o.label}
			tabindex={selected ? 0 : -1}
			class="seg-item"
			class:has-label={!!o.label}
			class:selected
			disabled={o.disabled}
			onclick={() => select(o.value)}
		>
			{#if optionSnippet}
				{@render optionSnippet(o, selected)}
			{:else}
				{#if o.icon}<Icon name={o.icon} />{/if}
				{#if o.label}<span class="seg-label">{o.label}</span>{/if}
				{#if o.count !== undefined}<span class="seg-count">{o.count}</span>{/if}
			{/if}
		</button>
	{/each}
</div>

<style>
	.seg {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		padding: 3px;
		background: var(--bg-elevated-2);
		border: 1px solid var(--border);
		border-radius: var(--r-pill);
	}
	.seg-icon {
		border-radius: var(--r-md);
	}

	.seg-item {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: 0.3rem var(--sp-3);
		border: 0;
		border-radius: var(--r-pill);
		background: transparent;
		color: var(--text-muted);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		line-height: 1.3;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.seg-sm .seg-item {
		padding: 0.2rem var(--sp-2);
		font-size: var(--fs-xs);
	}
	/* Compact toolbar contract: the outer interactive box exactly matches
	   Button size="sm" and Popover size="sm". */
	.seg-sm {
		height: var(--control-height-compact);
		min-height: var(--control-height-compact);
	}
	.seg-sm .seg-item {
		height: 100%;
	}
	.seg-icon .seg-item {
		gap: 0;
		padding: 0.35rem;
		border-radius: var(--r-sm);
		font-size: var(--fs-md);
	}
	.seg-icon.seg-sm .seg-item {
		padding: 0.25rem;
		font-size: var(--fs-sm);
	}
	/* A labelled icon segment renders <icon><label>, so it must keep the normal
	   icon/label gap and the roomier pill padding — only true icon-only segments
	   collapse to the square gap:0 layout above. */
	.seg-icon .seg-item.has-label {
		gap: var(--sp-2);
		padding: 0.3rem var(--sp-3);
	}
	.seg-icon.seg-sm .seg-item.has-label {
		padding: 0.2rem var(--sp-2);
	}

	/* collapseLabels='mobile': below the breakpoint, drop the label text and
	   tighten labelled segments back to a square icon button. The aria-label on
	   the button preserves the accessible name. */
	@media (max-width: 47.999rem) {
		.seg-collapse-mobile .seg-item.has-label .seg-label {
			display: none;
		}
		.seg-collapse-mobile .seg-item.has-label {
			gap: 0;
			padding: 0.35rem;
		}
		.seg-collapse-mobile.seg-sm .seg-item.has-label {
			padding: 0.25rem;
		}
	}

	.seg-item:hover:not(:disabled):not(.selected) {
		color: var(--text);
		background: var(--bg-elevated);
	}
	.seg-item.selected {
		color: var(--text);
		background: var(--bg);
		box-shadow: var(--shadow-sm);
	}
	.seg-item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.seg-item:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.seg-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		padding: 0 0.35rem;
		border-radius: var(--r-pill);
		background: var(--bg-elevated-2);
		color: var(--text-faint);
		font-size: 0.6875rem;
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
		transition:
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.seg-item.selected .seg-count {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}
</style>
