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
	//   variant        — `liquid`: two soft pulses flow through the track while
	//                    indeterminate; `stripes`: a diagonal shimmer drifts over
	//                    the fill.
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
		variant = 'default',
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
		variant?: 'default' | 'liquid' | 'stripes';
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
	const STRIPES =
		'linear-gradient(45deg, rgba(255, 255, 255, 0.18) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.18) 50%, rgba(255, 255, 255, 0.18) 75%, transparent 75%, transparent)';
	const barImage = $derived.by(() => {
		if (!color || !gradient) return undefined;
		const sweep = `linear-gradient(90deg, ${color}, var(--c-teal))`;
		return striped ? `${STRIPES}, ${sweep}` : sweep;
	});
	const liquid = $derived(variant === 'liquid' && indeterminate);
</script>

{#snippet track()}
<div
	data-tsu="Progress"
	class="progress tone-{toneClass} size-{size} v-{variant} {klass}"
	class:grow={grow}
	class:no-shrink={!shrink}
	class:block={block}
	class:indeterminate
	class:colored={!!color}
	style:--fill={liquid ? color : undefined}
	{...rest}
	class:gradient
	class:striped
	role="progressbar"
	aria-label={label}
	aria-valuemin={indeterminate ? undefined : 0}
	aria-valuemax={indeterminate ? undefined : max}
	aria-valuenow={indeterminate ? undefined : value}
>
	<div
		class="bar"
		style:translate={indeterminate ? undefined : `${pct - 100}% 0`}
		style:color={color}
		style:background-image={barImage}
	></div>
	{#each markers as m, i (`${i}:${m.at}`)}
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
		background: var(--track-fill);
		border-radius: var(--r-pill);
		overflow: hidden;
	}
	.progress.size-sm {
		height: 0.3125rem;
	}
	.bar {
		width: 100%;
		height: 100%;
		background: var(--accent);
		border-radius: inherit;
		translate: 0% 0;
		transition: translate var(--dur-base) var(--ease-out);
	}
	.marker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		transform: translateX(-50%);
		background: var(--text);
		pointer-events: none;
	}
	.marker.tone-ok {
		background: var(--ok);
	}
	.marker.tone-warn {
		background: var(--warn);
	}
	.marker.tone-danger {
		background: var(--danger);
	}
	.marker.tone-info {
		background: var(--info);
	}
	.marker.tone-accent {
		background: var(--accent);
	}
	.tone-success .bar {
		background: var(--ok);
	}
	.tone-info .bar {
		background: var(--info);
	}
	.tone-neutral .bar {
		background: var(--text-faint);
	}
	.tone-warn .bar {
		background: var(--warn);
	}
	.tone-danger .bar {
		background: var(--danger);
	}
	.progress.colored .bar {
		background: currentColor;
	}
	.progress.gradient .bar {
		background: linear-gradient(90deg, var(--accent), var(--c-teal));
	}
	.progress.gradient.tone-success .bar {
		background: linear-gradient(90deg, var(--ok), var(--c-teal));
	}
	.progress.gradient.tone-info .bar {
		background: linear-gradient(90deg, var(--info), var(--c-teal));
	}
	.progress.gradient.tone-neutral .bar {
		background: linear-gradient(90deg, var(--text-faint), var(--c-teal));
	}
	.progress.gradient.tone-warn .bar {
		background: linear-gradient(90deg, var(--warn), var(--c-teal));
	}
	.progress.gradient.tone-danger .bar {
		background: linear-gradient(90deg, var(--danger), var(--c-teal));
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
			linear-gradient(90deg, var(--accent), var(--c-teal));
		background-size:
			1rem 1rem,
			100% 100%;
	}
	.progress.gradient.striped.tone-success .bar {
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
			linear-gradient(90deg, var(--ok), var(--c-teal));
	}
	.progress.gradient.striped.tone-info .bar {
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
			linear-gradient(90deg, var(--info), var(--c-teal));
	}
	.progress.gradient.striped.tone-neutral .bar {
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
			linear-gradient(90deg, var(--text-faint), var(--c-teal));
	}
	.progress.gradient.striped.tone-warn .bar {
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
			linear-gradient(90deg, var(--warn), var(--c-teal));
	}
	.progress.gradient.striped.tone-danger .bar {
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
			linear-gradient(90deg, var(--danger), var(--c-teal));
	}
	.progress.indeterminate .bar {
		width: 40%;
		animation: kt-progress-slide 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
	.progress.striped .bar {
		animation: kt-stripe 0.6s linear infinite;
	}
	.progress.striped.indeterminate .bar {
		animation:
			kt-progress-slide 1.3s cubic-bezier(0.65, 0, 0.35, 1) infinite,
			kt-stripe 0.6s linear infinite;
	}
	@keyframes kt-progress-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(250%);
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
		.progress.indeterminate .bar {
			width: 100%;
			opacity: 0.35;
		}
	}
	.progress.v-liquid.indeterminate .bar {
		animation: none;
		opacity: 0;
	}
	.progress.v-liquid.indeterminate::before,
	.progress.v-liquid.indeterminate::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 55%;
		border-radius: inherit;
		background: linear-gradient(90deg, transparent, var(--accent) 35% 65%, transparent);
		transform: translateX(-100%);
		animation: tsu-progress-liquid 1.7s var(--ease-drawer) infinite;
	}
	.progress.v-liquid.indeterminate.tone-success::before,
	.progress.v-liquid.indeterminate.tone-success::after {
		background: linear-gradient(90deg, transparent, var(--ok) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate.tone-info::before,
	.progress.v-liquid.indeterminate.tone-info::after {
		background: linear-gradient(90deg, transparent, var(--info) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate.tone-neutral::before,
	.progress.v-liquid.indeterminate.tone-neutral::after {
		background: linear-gradient(90deg, transparent, var(--text-faint) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate.tone-warn::before,
	.progress.v-liquid.indeterminate.tone-warn::after {
		background: linear-gradient(90deg, transparent, var(--warn) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate.tone-danger::before,
	.progress.v-liquid.indeterminate.tone-danger::after {
		background: linear-gradient(90deg, transparent, var(--danger) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate.colored::before,
	.progress.v-liquid.indeterminate.colored::after {
		background: linear-gradient(90deg, transparent, var(--fill) 35% 65%, transparent);
	}
	.progress.v-liquid.indeterminate::after {
		width: 35%;
		opacity: 0.55;
		animation: tsu-progress-liquid-2 1.7s var(--ease-in-out) -0.7s infinite;
	}
	@keyframes tsu-progress-liquid {
		to {
			transform: translateX(282%);
		}
	}
	@keyframes tsu-progress-liquid-2 {
		to {
			transform: translateX(386%);
		}
	}
	.progress.v-stripes .bar {
		position: relative;
		overflow: hidden;
	}
	.progress.v-stripes .bar::after {
		content: '';
		position: absolute;
		inset: 0 -1.5rem 0 0;
		background: repeating-linear-gradient(
			135deg,
			transparent 0 0.5rem,
			color-mix(in srgb, var(--text-on-accent) 28%, transparent) 0.5rem 1rem
		);
		animation: tsu-progress-stripes 0.7s linear infinite;
	}
	@keyframes tsu-progress-stripes {
		from {
			transform: translateX(-1.4142rem);
		}
		to {
			transform: translateX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.progress.v-liquid.indeterminate {
			background: color-mix(in srgb, var(--accent) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.tone-success {
			background: color-mix(in srgb, var(--ok) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.tone-info {
			background: color-mix(in srgb, var(--info) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.tone-neutral {
			background: color-mix(in srgb, var(--text-faint) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.tone-warn {
			background: color-mix(in srgb, var(--warn) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.tone-danger {
			background: color-mix(in srgb, var(--danger) 35%, transparent);
		}
		.progress.v-liquid.indeterminate.colored {
			background: color-mix(in srgb, var(--fill) 35%, transparent);
		}
		.progress.v-liquid.indeterminate::before,
		.progress.v-liquid.indeterminate::after {
			display: none;
		}
		.progress.v-liquid.indeterminate .bar {
			display: none;
		}
		.progress.v-stripes .bar::after {
			animation: none;
		}
	}
</style>
