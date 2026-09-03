<script lang="ts">
	// Shimmering placeholder bar(s) standing in for content that is still
	// loading. Decorative only — the surrounding region should carry aria-busy.
	let {
		width = '100%',
		height = '1em',
		lines = 1,
		circle = false,
		radius = 'var(--r-sm)',
		class: klass = '',
		...rest
	}: {
		width?: string;
		height?: string;
		/** Stacked bars; the last one is shortened to read as a paragraph. */
		lines?: number;
		/** Round avatar placeholder — width follows height. */
		circle?: boolean;
		radius?: string;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const w = $derived(circle ? height : width);
	const r = $derived(circle ? '50%' : radius);
	const count = $derived(Math.max(1, Math.floor(lines)));
</script>

<span class="skeleton {klass}" data-tsu="Skeleton" aria-hidden="true" style:width={w} {...rest}>
	{#each { length: count } as _, i (i)}
		<span
			class="skeleton-bar"
			style:height
			style:border-radius={r}
			style:width={count > 1 && i === count - 1 ? '60%' : undefined}
		></span>
	{/each}
</span>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		max-width: 100%;
	}
	.skeleton-bar {
		display: block;
		width: 100%;
		background: linear-gradient(90deg, var(--bg-elevated-2) 25%, var(--bg-elevated) 50%, var(--bg-elevated-2) 75%);
		background-size: 200% 100%;
		animation: tsu-shimmer 1.4s ease-in-out infinite;
	}
	@keyframes tsu-shimmer {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-bar {
			animation: none;
			background: var(--bg-elevated-2);
		}
	}
</style>
