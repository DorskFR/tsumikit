<script lang="ts" module>
	import type { IconName } from '../atoms/Icon.svelte';
	import type { Tone } from '$lib/tone';

	export type MetricSegment = {
		glyph?: string;
		icon?: IconName;
		value: string | number;
		tone?: Tone;
		hint?: string;
	};
</script>

<script lang="ts">
	import { canonicalTone } from '$lib/tone';
	// KPI / stat tile — the dashboard's repeating "one number" card. Composes on
	// top of `Card` and lays out four parts:
	//   • an uppercase, letter-spaced micro-label (top-left)
	//   • a tinted icon chip (top-right) when `icon` is set
	//   • a large MONO value with an optional small unit baseline-aligned after it
	//   • a faint sub-line under the value (delta / context)
	// `tone` tints the icon chip (and, when set, the value) with a semantic hue;
	// `neutral` keeps the chip on the plain accent. Everything is token-driven.
	import type { Snippet } from 'svelte';
	import Card from '../atoms/Card.svelte';
	import Icon from '../atoms/Icon.svelte';
	import Tooltip from './Tooltip.svelte';

	let {
		label,
		value,
		unit,
		sub,
		icon,
		tone = 'neutral',
		// Tint the value itself with the tone (not just the chip).
		tintValue = false,
		// Theme-aware surface shade, forwarded to the composed Card so tiles can
		// opt into the same shade as sibling panels (no app-level :global override).
		surface = 'base',
		size = 'md',
		layout = 'card',
		href,
		external = false,
		onclick,
		segments,
		class: klass = '',
		// Raw SVG markup for a custom icon — passed through to `Icon` so any glyph
		// outside the registry can fill the chip.
		iconChildren,
		...rest
	}: {
		label: string;
		value: string | number;
		unit?: string;
		sub?: string;
		icon?: IconName;
		tone?: Tone;
		tintValue?: boolean;
		surface?: 'base' | 'raised' | 'sunken';
		/** `sm` is a dense tile (smaller value, tighter padding). */
		size?: 'sm' | 'md';
		/** Render the tile as a link / button with tap feedback. */
		href?: string;
		/** With `href`: new tab plus an arrow glyph after the label. */
		external?: boolean;
		onclick?: (e: MouseEvent | KeyboardEvent) => void;
		/** `inline` drops the Card and renders a single stat row. */
		layout?: 'card' | 'inline';
		/** Extra stats after the value, each with an optional Tooltip hint. */
		segments?: MetricSegment[];
		class?: string;
		iconChildren?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#snippet segment(seg: MetricSegment)}
	{@const c = canonicalTone(seg.tone ?? 'neutral')}
	<span class="metric-seg metric-seg-{c}">
		{#if seg.icon}<Icon name={seg.icon} />{:else if seg.glyph}<span aria-hidden="true">{seg.glyph}</span>{/if}
		<span class="metric-seg-val">{seg.value}</span>
	</span>
{/snippet}

{#snippet segmentRow()}
	{#if segments?.length}
		<div class="metric-segments">
			{#each segments as seg, i (i)}
				{#if seg.hint}
					<Tooltip text={seg.hint}>{#snippet trigger()}{@render segment(seg)}{/snippet}</Tooltip>
				{:else}
					{@render segment(seg)}
				{/if}
			{/each}
		</div>
	{/if}
{/snippet}

{#if layout === 'inline'}
	<div
		data-tsu="Metric"
		class="metric metric-inline metric-{canonicalTone(tone)} {tintValue ? 'metric-tint' : ''} {klass}"
		class:metric-sm={size === 'sm'}
		{...rest}
	>
		<span class="metric-label">{label}</span>
		<span class="metric-value">
			<span class="metric-num">{value}</span>
			{#if unit}<span class="metric-unit">{unit}</span>{/if}
		</span>
		{@render segmentRow()}
		{#if sub}<span class="metric-sub">{sub}</span>{/if}
	</div>
{:else}
<Card
	data-tsu="Metric"
	class="metric metric-{canonicalTone(tone)} {tintValue ? 'metric-tint' : ''} {size === 'sm' ? 'metric-sm' : ''} {klass}"
	padding={size === 'sm' ? 'sm' : undefined}
	{surface}
	as={href ? 'a' : onclick ? 'button' : 'div'}
	{href}
	target={href && external ? '_blank' : undefined}
	rel={href && external ? 'noopener noreferrer' : undefined}
	{onclick}
	tap={!!(href || onclick)}
	{...rest}
>
	<div class="metric-head">
		<span class="metric-label">{label}{#if href && external}<Icon name="external" />{/if}</span>
		{#if icon || iconChildren}
			<span class="metric-chip" aria-hidden="true">
				{#if iconChildren}
					<Icon name={icon}>{@render iconChildren()}</Icon>
				{:else}
					<Icon name={icon} />
				{/if}
			</span>
		{/if}
	</div>
	<div class="metric-value">
		<span class="metric-num">{value}</span>
		{#if unit}<span class="metric-unit">{unit}</span>{/if}
	</div>
	{@render segmentRow()}
	{#if sub}<div class="metric-sub">{sub}</div>{/if}
</Card>
{/if}

<style>
	:global(.metric) {
		/* The tone hue the chip / value pull from; neutral falls back to accent. */
		--metric-tone: var(--accent);
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
	}
	:global(.metric-ok) {
		--metric-tone: var(--ok);
	}
	:global(.metric-warn) {
		--metric-tone: var(--warn);
	}
	:global(.metric-danger) {
		--metric-tone: var(--danger);
	}
	:global(.metric-info) {
		--metric-tone: var(--info);
	}

	.metric-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--sp-2);
	}
	.metric-label {
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		font-family: var(--font-mono);
		line-height: 1.4;
	}
	.metric-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--r-md);
		font-size: 1rem;
		color: var(--metric-tone);
		background: color-mix(in srgb, var(--metric-tone) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--metric-tone) 30%, transparent);
	}
	.metric-value {
		display: flex;
		align-items: baseline;
		gap: var(--sp-1);
		font-family: var(--font-mono);
		line-height: 1.1;
	}
	.metric-num {
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: var(--fs-2xl);
		font-weight: var(--fw-semibold);
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
	:global(.metric-tint) .metric-num {
		color: var(--metric-tone);
	}
	.metric-unit {
		font-size: var(--fs-sm);
		font-weight: var(--fw-normal);
		color: var(--text-muted);
	}
	.metric-sub {
		font-size: var(--fs-xs);
		color: var(--text-faint);
		line-height: 1.4;
	}
	:global(.metric-sm) .metric-num {
		font-size: var(--fs-lg);
	}
	:global(.metric-sm) .metric-chip {
		width: 1.5rem;
		height: 1.5rem;
		font-size: 0.875rem;
	}
	.metric-inline {
		flex-direction: row;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--sp-2) var(--sp-3);
		min-width: 0;
	}
	.metric-inline .metric-num {
		font-size: var(--fs-md);
	}
	.metric-segments {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--sp-1) var(--sp-3);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.metric-seg {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		--seg-tone: var(--text-muted);
		color: var(--seg-tone);
		font-variant-numeric: tabular-nums;
	}
	.metric-seg-ok {
		--seg-tone: var(--ok);
	}
	.metric-seg-warn {
		--seg-tone: var(--warn);
	}
	.metric-seg-danger {
		--seg-tone: var(--danger);
	}
	.metric-seg-info {
		--seg-tone: var(--info);
	}
	.metric-seg-accent {
		--seg-tone: var(--accent);
	}
</style>
