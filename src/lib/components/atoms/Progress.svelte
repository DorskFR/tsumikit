<script lang="ts">
	import type { ControlSize } from '$lib/size';
	import { canonicalTone, type Tone } from '$lib/tone';
	// Progress bar. Determinate when `value` is a number (0..max); omit `value`
	// (or pass `indeterminate`) for an indeterminate animation. Uses
	// role="progressbar" with the right aria-value* attributes. Token-styled.
	//
	// Variants (all token-driven, composable):
	//   size='sm'      — thin track (~5px) for inline download/health rows.
	//   gradient       — accent→teal fill (storage meter / library-health bars).
	//   striped        — diagonal stripes; animated while in-flight (unpacking).
	//   indeterminate  — explicit "scanning"/"importing" mode without a percentage.
	let {
		value,
		max = 100,
		label,
		tone = 'accent',
		size = 'md',
		gradient = false,
		striped = false,
		grow = false,
		shrink = true,
		block = false,
		indeterminate: indeterminateProp = false,
		markers = [],
		toneAt,
		color,
		showValue = false,
		format = (v: number, m: number) => `${Math.round((v / m) * 100)}%`,
		class: klass = '',
		...rest
	}: {
		value?: number;
		max?: number;
		label?: string;
		// Fill colour. `accent` is the default brand fill; the semantic tones
		// retint the bar for severity (e.g. usage meters going warm/hot).
		// `ok` and `success` are aliases.
		tone?: Tone;
		// Track height. `sm` is a thin ~5px track for inline rows.
		size?: ControlSize;
		/** Fill the free space of a flex row (`flex: 1 1 0`). */
		grow?: boolean;
		/** `false` pins the box (`flex: none`) so a flex row cannot squeeze it. */
		shrink?: boolean;
		/** Full-width block. */
		block?: boolean;
		// Accent→teal gradient fill (overrides the flat tone colour).
		gradient?: boolean;
		// Diagonal stripes; animated in indeterminate mode.
		striped?: boolean;
		// Force indeterminate mode even when a `value` is supplied.
		indeterminate?: boolean;
		/** Thin vertical lines at `at / max` (caps, thresholds). */
		markers?: { at: number; label?: string; tone?: Tone }[];
		/** Percent thresholds that auto-pick warn/danger; an explicit `tone` other
		 *  than the default `accent` wins. */
		toneAt?: { warn?: number; danger?: number };
		/** Any CSS colour for the fill; wins over `tone`. */
		color?: string;
		/** Trailing numeric readout after the track. */
		showValue?: boolean;
		format?: (value: number, max: number) => string;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const pct = $derived(value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100)));
	const indeterminate = $derived(indeterminateProp || value == null);
	const autoTone = $derived.by((): Tone => {
		if (!toneAt || tone !== 'accent' || indeterminate) return tone;
		if (toneAt.danger !== undefined && pct >= toneAt.danger) return 'danger';
		if (toneAt.warn !== undefined && pct >= toneAt.warn) return 'warn';
		return tone;
	});
	const toneClass = $derived(canonicalTone(autoTone) === 'ok' ? 'success' : canonicalTone(autoTone));
	const markerPct = (at: number) => Math.max(0, Math.min(100, (at / max) * 100));
</script>

{#snippet track()}
<div
	data-tsu="Progress"
	class="progress tone-{toneClass} size-{size} {klass}"
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}
	class:indeterminate
	style:--fill={color}
	{...rest}
	class:gradient
	class:striped
	role="progressbar"
	aria-label={label}
	aria-valuemin={indeterminate ? undefined : 0}
	aria-valuemax={indeterminate ? undefined : max}
	aria-valuenow={indeterminate ? undefined : value}
>
	<div class="bar" style={indeterminate ? undefined : `width: ${pct}%`}></div>
	{#each markers as m (m.at)}
		<span
			class="marker tone-{m.tone ? canonicalTone(m.tone) : 'text'}"
			style="left: {markerPct(m.at)}%"
			title={m.label}
			aria-hidden="true"
		></span>
	{/each}
</div>
{/snippet}

{#if showValue}
	<span class="progress-row" class:grow={grow} class:no-shrink={!shrink} class:block={block}>
		{@render track()}
		<span class="progress-value">{indeterminate || value == null ? '' : format(value, max)}</span>
	</span>
{:else}
	{@render track()}
{/if}

<style>
	.progress-row {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
	}
	.progress-value {
		flex: none;
		min-width: 3ch;
		text-align: right;
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}
	.grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.no-shrink {
		flex: none;
	}
	.block {
		display: flex;
		width: 100%;
	}
	.progress {
		position: relative;
		width: 100%;
		height: 0.5rem;
		background: var(--bg-elevated-2);
		border-radius: var(--r-pill);
		overflow: hidden;
	}
	.progress.size-sm {
		height: 0.3125rem;
	}
	.bar {
		height: 100%;
		background: var(--fill, var(--accent));
		border-radius: inherit;
		transition: width 0.2s var(--ease);
	}
	.marker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		transform: translateX(-50%);
		background: var(--marker, var(--text));
		pointer-events: none;
	}
	.marker.tone-ok {
		--marker: var(--ok);
	}
	.marker.tone-warn {
		--marker: var(--warn);
	}
	.marker.tone-danger {
		--marker: var(--danger);
	}
	.marker.tone-info {
		--marker: var(--info);
	}
	.marker.tone-accent {
		--marker: var(--accent);
	}
	.tone-success {
		--fill: var(--ok);
	}
	.tone-info {
		--fill: var(--info);
	}
	.tone-neutral {
		--fill: var(--text-faint);
	}
	.tone-warn {
		--fill: var(--warn);
	}
	.tone-danger {
		--fill: var(--danger);
	}
	.progress.gradient .bar {
		background: linear-gradient(90deg, var(--fill, var(--accent)), var(--c-teal));
	}
	.progress.striped .bar {
		background-image: linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.18) 25%,
			transparent 25%,
			transparent 50%,
			rgba(255, 255, 255, 0.18) 50%,
			rgba(255, 255, 255, 0.18) 75%,
			transparent 75%,
			transparent
		);
		background-size: 1rem 1rem;
	}
	.progress.gradient.striped .bar {
		background-image:
			linear-gradient(
				45deg,
				rgba(255, 255, 255, 0.18) 25%,
				transparent 25%,
				transparent 50%,
				rgba(255, 255, 255, 0.18) 50%,
				rgba(255, 255, 255, 0.18) 75%,
				transparent 75%,
				transparent
			),
			linear-gradient(90deg, var(--fill, var(--accent)), var(--c-teal));
		background-size:
			1rem 1rem,
			100% 100%;
	}
	.progress.indeterminate .bar {
		width: 40%;
		animation: kt-progress-slide 1.1s ease-in-out infinite;
	}
	.progress.striped .bar {
		animation: kt-stripe 0.6s linear infinite;
	}
	.progress.striped.indeterminate .bar {
		animation:
			kt-progress-slide 1.1s ease-in-out infinite,
			kt-stripe 0.6s linear infinite;
	}
	@keyframes kt-progress-slide {
		0% {
			transform: translateX(-110%);
		}
		100% {
			transform: translateX(310%);
		}
	}
	@keyframes kt-stripe {
		0% {
			background-position: 0 0;
		}
		100% {
			background-position: 1rem 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.progress.indeterminate .bar,
		.progress.striped .bar,
		.progress.striped.indeterminate .bar {
			animation: none;
		}
	}
</style>
