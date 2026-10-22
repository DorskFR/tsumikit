<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Shimmering placeholder bar(s) standing in for content that is still
	// loading. Decorative only — the surrounding region should carry aria-busy.
	// Bars are tinted from --text so they read on any surface. `shimmer` is a
	// viewport-anchored sweep so every bar on screen shimmers in sync; `sheen`
	// runs one light across each bar; `pulse` breathes in opacity, each bar a
	// beat behind the previous one (`--skeleton-phase` offsets the whole set).
	type Own = {
		width?: string;
		height?: string;
		/** Stacked bars; the last one is shortened to read as a paragraph. */
		lines?: number;
		/** Round avatar placeholder — width follows height. */
		circle?: boolean;
		radius?: string;
		variant?: 'shimmer' | 'sheen' | 'pulse';
		class?: string;
	};
	let {
		width = '100%',
		height = '1em',
		lines = 1,
		circle = false,
		radius = 'var(--r-sm)',
		variant = 'shimmer',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const w = $derived(circle ? height : width);
	const r = $derived(circle ? '50%' : radius);
	const count = $derived(Math.max(1, Math.floor(lines)));
</script>

<span class="skeleton v-{variant} {klass}" data-tsu="Skeleton" aria-hidden="true" style:width={w} {...rest}>
	{#each { length: count } as _, i (i)}
		<span
			class="skeleton-bar"
			style:height
			style:border-radius={r}
			style:width={count > 1 && i === count - 1 ? '60%' : undefined}
			style:--i={i}
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
	.v-sheen .skeleton-bar,
	.v-pulse .skeleton-bar {
		background: var(--sk-base);
	}
	.v-sheen .skeleton-bar {
		position: relative;
		overflow: hidden;
		animation: none;
	}
	.v-sheen .skeleton-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 45%;
		background: linear-gradient(100deg, transparent 20%, var(--sk-hi) 50%, transparent 80%);
		transform: translateX(-100%);
		animation: tsu-skeleton-sheen 2s var(--ease-in-out) infinite;
	}
	@keyframes tsu-skeleton-sheen {
		70%,
		100% {
			transform: translateX(260%);
		}
	}
	.v-pulse .skeleton-bar {
		animation: tsu-skeleton-pulse 1.6s var(--ease-in-out) infinite;
		animation-delay: calc(0.13s * (var(--i, 0) + var(--skeleton-phase, 0)));
	}
	@keyframes tsu-skeleton-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.45;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.v-pulse .skeleton-bar {
			animation: none;
		}
		.v-sheen .skeleton-bar::after {
			animation: none;
			transform: translateX(60%);
		}
	}
</style>
