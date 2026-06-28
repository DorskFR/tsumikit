<script lang="ts">
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
	import Icon, { type IconName } from '../atoms/Icon.svelte';

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

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
		class?: string;
		iconChildren?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<Card
	data-tsu="Metric"
	class="metric metric-{tone} {tintValue ? 'metric-tint' : ''} {klass}"
	{surface}
	{...rest}
>
	<div class="metric-head">
		<span class="metric-label">{label}</span>
		{#if icon || iconChildren}
			<span class="metric-chip" aria-hidden="true">
				<!-- Only forward a children snippet when a custom icon was actually
				     provided; otherwise Icon's `children` branch always wins and the
				     registry `name` glyph never renders (empty chip). -->
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
	{#if sub}<div class="metric-sub">{sub}</div>{/if}
</Card>

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
</style>
