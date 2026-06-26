<script lang="ts">
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
		indeterminate: indeterminateProp = false,
		class: klass = ''
	}: {
		value?: number;
		max?: number;
		label?: string;
		// Fill colour. `accent` is the default brand fill; the semantic tones
		// retint the bar for severity (e.g. usage meters going warm/hot).
		tone?: 'accent' | 'success' | 'warn' | 'danger';
		// Track height. `sm` is a thin ~5px track for inline rows.
		size?: 'sm' | 'md';
		// Accent→teal gradient fill (overrides the flat tone colour).
		gradient?: boolean;
		// Diagonal stripes; animated in indeterminate mode.
		striped?: boolean;
		// Force indeterminate mode even when a `value` is supplied.
		indeterminate?: boolean;
		class?: string;
	} = $props();

	const pct = $derived(value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100)));
	const indeterminate = $derived(indeterminateProp || value == null);
</script>

<div
	data-tsu="Progress"
	class="progress tone-{tone} size-{size} {klass}"
	class:indeterminate
	class:gradient
	class:striped
	role="progressbar"
	aria-label={label}
	aria-valuemin={indeterminate ? undefined : 0}
	aria-valuemax={indeterminate ? undefined : max}
	aria-valuenow={indeterminate ? undefined : value}
>
	<div class="bar" style={indeterminate ? undefined : `width: ${pct}%`}></div>
</div>

<style>
	.progress {
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
	.tone-success {
		--fill: var(--ok);
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
