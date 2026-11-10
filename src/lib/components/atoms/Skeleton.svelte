<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Shimmering placeholder standing in for content that is still loading.
	// Decorative only: the surrounding region should carry aria-busy. Without
	// `height` each line fills the line box of the surrounding text (`1lh`), so
	// `lines={3}` is as tall as three lines of that text. Bars are tinted from
	// --text so they read on any surface. `shimmer` is a viewport-anchored sweep
	// so every bar on screen shimmers in sync; `sheen` runs one light across each
	// bar; `pulse` breathes in opacity, each bar a beat behind the previous one
	// (`--skeleton-phase` offsets the whole set).
	type Own = {
		width?: string;
		/** Fixed bar height, stacked with a gap. Omit to fill the text line box. */
		height?: string;
		/** Stacked lines; the last one is shortened to read as a paragraph. */
		lines?: number;
		/** Round avatar placeholder: width follows height. */
		circle?: boolean;
		/** Block at a CSS aspect-ratio (`"2/3"`, `"16/9"`) of `width`, for a cover or tile. */
		aspect?: string;
		/** Box at the kit control height and radius, for a form row. */
		control?: boolean;
		radius?: string;
		variant?: 'shimmer' | 'sheen' | 'pulse';
		class?: string;
	};
	let {
		width = '100%',
		height,
		lines = 1,
		circle = false,
		aspect,
		control = false,
		radius,
		variant = 'shimmer',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const lineBox = $derived(height === undefined && !circle && !aspect && !control);
	const h = $derived(aspect ? undefined : control ? 'var(--control-height-default)' : (height ?? '1em'));
	const w = $derived(circle ? h : width);
	const shapeRadius = $derived(aspect ? 'var(--r-md)' : control ? 'var(--input-radius, var(--r-md))' : 'var(--r-sm)');
	const r = $derived(circle ? '50%' : radius ?? shapeRadius);
	const count = $derived(Math.max(1, Math.floor(lines)));
</script>

{#snippet bar(i: number)}
	<span
		class="skeleton-bar"
		style:height={h}
		style:aspect-ratio={aspect}
		style:border-radius={r}
		style:width={count > 1 && i === count - 1 ? '60%' : undefined}
		style:--i={i}
	></span>
{/snippet}

<span
	class="skeleton v-{variant} {klass}"
	class:skeleton-text={lineBox}
	data-tsu="Skeleton"
	aria-hidden="true"
	style:width={w}
	{...rest}
>
	{#each { length: count } as _, i (i)}
		{#if lineBox}
			<span class="skeleton-line">{@render bar(i)}</span>
		{:else}
			{@render bar(i)}
		{/if}
	{/each}
</span>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		max-width: 100%;
	}
	.skeleton-text {
		gap: 0;
	}
	.skeleton-line {
		display: flex;
		align-items: center;
		height: 1lh;
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
