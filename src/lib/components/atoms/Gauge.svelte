<script lang="ts" module>
	export type GaugeTone = 'ok' | 'warn' | 'danger';

	export function clampPct(value: number): number {
		return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
	}

	export function gaugeTone(value: number, warnAt = 70, dangerAt = 90): GaugeTone {
		const v = clampPct(value);
		if (v >= dangerAt) return 'danger';
		if (v >= warnAt) return 'warn';
		return 'ok';
	}

	export function litSegments(value: number, segments = 3): number {
		const v = clampPct(value);
		if (segments <= 0) return 0;
		return Math.min(segments, Math.floor((v / 100) * segments));
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value,
		variant = 'continuous',
		segments = 3,
		tone,
		warnAt = 70,
		dangerAt = 90,
		label,
		as = 'div',
		width,
		height,
		corner,
		class: klass = '',
		style = '',
		...rest
	}: {
		value: number;
		variant?: 'continuous' | 'segments';
		// `segments` variant only: number of stacked bars, lit bottom-up.
		segments?: number;
		// Forces the fill colour; otherwise derived from `warnAt` / `dangerAt`.
		tone?: GaugeTone;
		warnAt?: number;
		dangerAt?: number;
		label?: string;
		as?: 'div' | 'a' | 'button';
		width?: string;
		height?: string;
		corner?: Snippet;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();

	const pct = $derived(clampPct(value));
	const resolvedTone = $derived(tone ?? gaugeTone(pct, warnAt, dangerAt));
	const lit = $derived(litSegments(pct, segments));
	const segmentCount = $derived(Math.max(0, Math.floor(segments)));
</script>

<svelte:element
	this={as}
	data-tsu="Gauge"
	class="gauge tone-{resolvedTone} {klass}"
	class:interactive={as !== 'div'}
	type={as === 'button' ? 'button' : undefined}
	role="meter"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-valuenow={pct}
	style:--gauge-w={width}
	style:--gauge-h={height}
	{style}
	{...rest}
>
	{#if variant === 'segments'}
		<span class="segments" style:--gauge-segments={segmentCount}>
			{#each { length: segmentCount } as _, i (i)}
				<span class="segment" class:lit={i < lit}></span>
			{/each}
		</span>
	{:else}
		<span class="fill" style:height="{pct}%"></span>
	{/if}
	{#if corner}
		<span class="corner">{@render corner()}</span>
	{/if}
</svelte:element>

<style>
	.gauge {
		position: relative;
		display: inline-flex;
		flex: none;
		box-sizing: border-box;
		width: var(--gauge-w, 0.875rem);
		height: var(--gauge-h, 1.25rem);
		margin: 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--bg-elevated-2);
		overflow: visible;
		color: inherit;
		font: inherit;
		text-decoration: none;
		vertical-align: middle;
	}
	.interactive {
		cursor: pointer;
	}
	.interactive:hover {
		border-color: var(--gauge-fill);
	}
	.interactive:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.tone-ok {
		--gauge-fill: var(--ok);
	}
	.tone-warn {
		--gauge-fill: var(--warn);
	}
	.tone-danger {
		--gauge-fill: var(--danger);
	}
	.fill {
		position: absolute;
		inset: auto 0 0 0;
		border-radius: calc(var(--r-sm) - 1px);
		background: var(--gauge-fill);
		transition: height 0.2s var(--ease), background 0.2s var(--ease);
	}
	.segments {
		position: absolute;
		inset: 2px;
		display: flex;
		flex-direction: column-reverse;
		gap: 2px;
	}
	.segment {
		flex: 1 1 0%;
		border-radius: 2px;
		background: var(--bg-elevated);
		transition: background 0.2s var(--ease);
	}
	.segment.lit {
		background: var(--gauge-fill);
	}
	.corner {
		position: absolute;
		right: -0.35em;
		bottom: -0.35em;
		display: inline-flex;
		font-size: 0.625rem;
		line-height: 1;
		pointer-events: none;
	}
</style>
