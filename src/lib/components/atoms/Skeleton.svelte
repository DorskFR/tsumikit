<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Shimmering placeholder bar(s) standing in for content that is still
	// loading. Decorative only — the surrounding region should carry aria-busy.
	// Bars are tinted from --text so they read on any surface; the sweep is
	// viewport-anchored so every bar on screen shimmers in sync.
	type Own = {
		width?: string;
		height?: string;
		/** Stacked bars; the last one is shortened to read as a paragraph. */
		lines?: number;
		/** Round avatar placeholder — width follows height. */
		circle?: boolean;
		radius?: string;
		class?: string;
	};
	let {
		width = '100%',
		height = '1em',
		lines = 1,
		circle = false,
		radius = 'var(--r-sm)',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

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
		--sk-base: var(--skeleton, color-mix(in srgb, var(--text) 7%, transparent));
		--sk-hi: var(--skeleton-highlight, color-mix(in srgb, var(--text) 13%, transparent));
		display: block;
		width: 100%;
		background: linear-gradient(100deg, var(--sk-base) 42%, var(--sk-hi) 50%, var(--sk-base) 58%) var(--sk-base);
		background-size: 200vw 100%;
		background-attachment: fixed;
		animation: tsu-shimmer 1.8s linear infinite;
	}
	@keyframes tsu-shimmer {
		0% {
			background-position: 100% 0;
		}
		75%,
		100% {
			background-position: 0% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-bar {
			animation: none;
			background: var(--sk-base);
		}
	}
</style>
