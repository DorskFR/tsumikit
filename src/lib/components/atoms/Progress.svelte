<script lang="ts">
	// Progress bar. Determinate when `value` is a number (0..max); omit `value`
	// for an indeterminate animation. Uses role="progressbar" with the right
	// aria-value* attributes. Token-styled.
	let {
		value,
		max = 100,
		label,
		class: klass = ''
	}: {
		value?: number;
		max?: number;
		label?: string;
		class?: string;
	} = $props();

	const pct = $derived(value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100)));
	const indeterminate = $derived(value == null);
</script>

<div
	class="progress {klass}"
	class:indeterminate
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
	.bar {
		height: 100%;
		background: var(--accent);
		border-radius: inherit;
		transition: width 0.2s var(--ease);
	}
	.progress.indeterminate .bar {
		width: 40%;
		animation: progress-slide 1.1s ease-in-out infinite;
	}
	@keyframes progress-slide {
		0% {
			transform: translateX(-110%);
		}
		100% {
			transform: translateX(310%);
		}
	}
</style>
