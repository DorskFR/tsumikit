<script lang="ts" module>
	// One bar split into segments, each with its own tone. Two modes:
	//   • segments (default): widths ∝ `max`, each filled value/max, thin gaps.
	//   • stacked: one shared track, widths ∝ `value` (Σvalue = full width, or
	//     `max` when given), every slice 100 % filled, no gaps; a zero value
	//     collapses to 0 width.
	export type ProgressSegment = {
		value: number;
		// Ignored in `stacked` mode.
		max: number;
		// Fill colour per segment. `ok` is an alias of `success`; `muted` renders a
		// faint fill for empty parts.
		tone?: 'accent' | 'success' | 'ok' | 'warn' | 'danger' | 'muted';
		// Native tooltip / accessible name / legend caption for the segment.
		label?: string;
	};

	export const TONE_FILL: Record<NonNullable<ProgressSegment['tone']>, string> = {
		accent: 'var(--accent)',
		success: 'var(--ok)',
		ok: 'var(--ok)',
		warn: 'var(--warn)',
		danger: 'var(--danger)',
		muted: 'var(--text-faint)',
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dot from './Dot.svelte';
	import Text from './Text.svelte';

	let {
		segments,
		label,
		size = 'md',
		mode = 'segments',
		gap = 2,
		max,
		legend = false,
		class: klass = '',
	}: {
		segments: ProgressSegment[];
		label?: string;
		// Track height. `sm` is a thin ~5px track for inline rows.
		size?: 'sm' | 'md';
		mode?: 'segments' | 'stacked';
		// Space between segments in `segments` mode; a bare number is px.
		gap?: number | string;
		// `stacked` only: total the slices are measured against. When Σvalue < max
		// the remainder shows the empty track.
		max?: number;
		// `true` = 'below'. A snippet receives the segments for custom rendering.
		legend?: boolean | 'inline' | 'below' | Snippet<[ProgressSegment[]]>;
		class?: string;
	} = $props();

	const stacked = $derived(mode === 'stacked');
	const totalMax = $derived(segments.reduce((s, seg) => s + Math.max(0, seg.max), 0));
	const totalValue = $derived(
		segments.reduce((s, seg) => s + Math.max(0, Math.min(seg.value, seg.max)), 0),
	);
	const stackedTotal = $derived(segments.reduce((s, seg) => s + Math.max(0, seg.value), 0));
	const remainder = $derived(max === undefined ? 0 : Math.max(0, max - stackedTotal));
	const gapCss = $derived(stacked ? '0' : typeof gap === 'number' ? `${gap}px` : gap);
	const legendPlacement = $derived(
		legend === true ? 'below' : legend === 'inline' || legend === 'below' ? legend : null,
	);
	const legendSnippet = $derived(typeof legend === 'function' ? legend : null);
	const hasLegend = $derived(legendPlacement !== null || legendSnippet !== null);
	const stackedLabel = $derived(
		[label, segments.map((seg) => `${seg.label ?? seg.tone ?? 'accent'} ${seg.value}`).join(', ')]
			.filter(Boolean)
			.join(': '),
	);

	function pct(seg: ProgressSegment): number {
		if (stacked) return 100;
		if (seg.max <= 0) return 0;
		return Math.max(0, Math.min(100, (seg.value / seg.max) * 100));
	}

	function grow(seg: ProgressSegment): number {
		return stacked ? Math.max(0, seg.value) : Math.max(seg.max, 1);
	}
</script>

{#snippet bar(rootClass: string)}
	{#if stacked}
		<div
			data-tsu="SegmentedProgress"
			class="segmented-progress stacked size-{size} {rootClass}"
			style="gap: {gapCss}"
			role="img"
			aria-label={stackedLabel}
		>
			{#each segments as seg, i (i)}
				<div class="segment tone-{seg.tone ?? 'accent'}" style="flex-grow: {grow(seg)}" title={seg.label}>
					<div class="bar" style="width: {pct(seg)}%"></div>
				</div>
			{/each}
			{#if remainder > 0}
				<div class="segment remainder" style="flex-grow: {remainder}"></div>
			{/if}
		</div>
	{:else}
		<div
			data-tsu="SegmentedProgress"
			class="segmented-progress size-{size} {rootClass}"
			style="gap: {gapCss}"
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={totalMax}
			aria-valuenow={totalValue}
		>
			{#each segments as seg, i (i)}
				<div class="segment tone-{seg.tone ?? 'accent'}" style="flex-grow: {grow(seg)}" title={seg.label}>
					<div class="bar" style="width: {pct(seg)}%"></div>
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

{#if hasLegend}
	<div data-tsu="SegmentedProgress" class="segmented-progress-wrap legend-{legendPlacement ?? 'below'} {klass}">
		{@render bar('')}
		{#if legendSnippet}
			{@render legendSnippet(segments)}
		{:else}
			<ul class="legend">
				{#each segments as seg, i (i)}
					<li class="legend-item">
						<Dot color={TONE_FILL[seg.tone ?? 'accent']} />
						{#if seg.label}
							<Text variant="caption">{seg.label}</Text>
						{/if}
						<Text variant="caption" weight="medium" numeric>{seg.value}</Text>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	{@render bar(klass)}
{/if}

<style>
	.segmented-progress {
		display: flex;
		width: 100%;
		height: 0.5rem;
		border-radius: var(--r-pill);
	}
	.segmented-progress.size-sm {
		height: 0.3125rem;
	}
	.segment {
		flex: 0 1 0%;
		min-width: 3px;
		height: 100%;
		background: var(--bg-elevated-2);
		overflow: hidden;
	}
	.segment:first-child {
		border-top-left-radius: var(--r-pill);
		border-bottom-left-radius: var(--r-pill);
	}
	.segment:last-child {
		border-top-right-radius: var(--r-pill);
		border-bottom-right-radius: var(--r-pill);
	}
	.bar {
		height: 100%;
		background: var(--fill, var(--accent));
		transition: width 0.2s var(--ease);
	}
	.tone-success,
	.tone-ok {
		--fill: var(--ok);
	}
	.tone-warn {
		--fill: var(--warn);
	}
	.tone-danger {
		--fill: var(--danger);
	}
	.tone-muted {
		--fill: var(--text-faint);
	}

	.stacked {
		overflow: hidden;
		background: var(--bg-elevated-2);
	}
	.stacked .segment {
		min-width: 0;
		border-radius: 0;
		background: transparent;
		transition: flex-grow 0.2s var(--ease);
	}

	.segmented-progress-wrap {
		display: flex;
		width: 100%;
		gap: var(--sp-2);
	}
	.legend-below {
		flex-direction: column;
	}
	.legend-inline {
		align-items: center;
	}
	.legend-inline .segmented-progress {
		flex: 1 1 0%;
		width: auto;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-1) var(--sp-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
