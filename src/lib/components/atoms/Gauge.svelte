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
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Own = {
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
		href?: string;
		width?: string;
		height?: string;
		corner?: Snippet;
		class?: string;
		style?: string;
	};
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
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const pct = $derived(clampPct(value));
	const inline = $derived((width ? `width: ${width};` : '') + (height ? `height: ${height};` : ''));
	const resolvedTone = $derived(tone ?? gaugeTone(pct, warnAt, dangerAt));
	const lit = $derived(litSegments(pct, segments));
	const segmentCount = $derived(Math.max(0, Math.floor(segments)));
	const isMeter = $derived(as === 'div');
	const ariaLabel = $derived(
		isMeter ? label : label ? `${label} (${Math.round(pct)}%)` : `${Math.round(pct)}%`
	);
</script>

<svelte:element
	this={as}
	data-tsu="Gauge"
	class="gauge tone-{resolvedTone} {klass}"
	class:interactive={as !== 'div'}
	type={as === 'button' ? 'button' : undefined}
	role={isMeter ? 'meter' : undefined}
	aria-label={ariaLabel}
	aria-valuemin={isMeter ? 0 : undefined}
	aria-valuemax={isMeter ? 100 : undefined}
	aria-valuenow={isMeter ? pct : undefined}
	style={inline + style || undefined}
	{...rest}
>
	{#if variant === 'segments'}
		<span class="segments">
			{#each { length: segmentCount } as _, i (i)}
				<span class="segment" class:lit={i < lit}></span>
			{/each}
		</span>
	{:else}
		<span class="fill" style:scale="1 {pct / 100}"></span>
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
		width: 0.875rem;
		height: 1.25rem;
		margin: 0;
		padding: 0;
		border: var(--edge-width) solid var(--track-edge);
		border-radius: var(--r-sm);
		background: var(--track-fill);
		overflow: visible;
		color: inherit;
		font: inherit;
		text-decoration: none;
		vertical-align: middle;
	}
	.interactive {
		cursor: pointer;
	}
	@media (hover: hover) and (pointer: fine) {
		.interactive.tone-ok:hover {
			border-color: var(--ok);
		}
		.interactive.tone-warn:hover {
			border-color: var(--warn);
		}
		.interactive.tone-danger:hover {
			border-color: var(--danger);
		}
	}
	.interactive:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.fill {
		position: absolute;
		inset: 0;
		border-radius: calc(var(--r-sm) - var(--sp-px));
		transform-origin: bottom;
		scale: 1 0;
		transition:
			scale var(--dur-base) var(--ease-out),
			background var(--dur-fast) var(--ease);
	}
	.segments {
		position: absolute;
		inset: var(--sp-0-5);
		display: flex;
		flex-direction: column-reverse;
		gap: var(--sp-0-5);
	}
	.segment {
		flex: 1 1 0%;
		border-radius: var(--r-xs);
		background: var(--bg-elevated);
		transition: background var(--dur-fast) var(--ease);
	}
	.tone-ok .fill,
	.tone-ok .segment.lit {
		background: var(--ok);
	}
	.tone-warn .fill,
	.tone-warn .segment.lit {
		background: var(--warn);
	}
	.tone-danger .fill,
	.tone-danger .segment.lit {
		background: var(--danger);
	}
	.corner {
		position: absolute;
		right: -0.35em;
		bottom: -0.35em;
		display: inline-flex;
		font-size: var(--fs-xs);
		line-height: var(--lh-none);
		pointer-events: none;
	}
</style>
