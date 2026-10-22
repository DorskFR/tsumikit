<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Cover / thumbnail tile: a lazy <img> that swaps to a seeded gradient with
	// initials (or an icon) when there is no source or it fails to load. Width
	// comes from `size`, height from `aspect`; `status` overlays a Dot/Badge in
	// the bottom-right corner.
	import type { Snippet } from 'svelte';
	import { artworkGradient, initials as initialsOf } from '$lib/artwork';
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';

	type Own = {
		src?: string | null;
		srcset?: string;
		sizes?: string;
		alt: string;
		/** Drives the gradient hue and the initials. Defaults to `alt`. */
		seed?: string;
		/** CSS aspect-ratio, e.g. '1/1', '2/3', '16/9'. */
		aspect?: '1/1' | '2/3' | '16/9' | (string & {});
		/** Width (any CSS length). Omit to fill the container. */
		size?: string;
		radius?: 'sm' | 'md' | 'lg' | 'pill';
		fit?: 'cover' | 'contain';
		fallback?: 'initials' | 'icon' | 'none';
		/** Glyph shown when `fallback="icon"`. */
		icon?: IconName;
		/** Overlay rendered bottom-right (a Dot or Badge). */
		status?: Snippet;
		/** Stronger border + shadow on hover, for tappable tiles. */
		hover?: boolean;
		onerror?: () => void;
		class?: string;
	};
	let {
		src,
		srcset,
		sizes,
		alt,
		seed,
		aspect = '1/1',
		size,
		radius = 'md',
		fit = 'cover',
		fallback = 'initials',
		icon = 'image',
		status,
		hover = false,
		onerror,
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	let failed = $state(false);
	$effect(() => {
		src;
		srcset;
		failed = false;
	});

	const key = $derived(seed ?? alt);
	const showImage = $derived(Boolean(src) && !failed);
	const tile = $derived(showImage ? undefined : alt.trim() ? 'named' : 'decorative');
	const gradient = $derived(showImage ? undefined : artworkGradient(key));
	const text = $derived(fallback === 'initials' ? initialsOf(key) : '');

	function fail() {
		failed = true;
		onerror?.();
	}
</script>

<div
	data-tsu="Artwork"
	class="artwork r-{radius} {klass}"
	class:hover
	style:aspect-ratio={aspect}
	style:width={size}
	style:background={gradient}
	role={tile === 'named' ? 'img' : undefined}
	aria-label={tile === 'named' ? alt : undefined}
	aria-hidden={tile === 'decorative' ? 'true' : undefined}
	{...rest}
>
	{#if showImage}
		<img {src} {srcset} {sizes} {alt} class="img fit-{fit}" loading="lazy" decoding="async" onerror={fail} />
	{:else if fallback === 'initials' && text}
		<span class="initials" aria-hidden="true">{text}</span>
	{:else if fallback === 'icon'}
		<span class="glyph" aria-hidden="true"><Icon name={icon} /></span>
	{/if}
	{#if status}
		<span class="status">{@render status()}</span>
	{/if}
</div>

<style>
	.artwork {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex: none;
		background: var(--surface-fill-2);
		border: var(--edge-width) solid var(--surface-edge);
		color: var(--text-muted);
		container-type: inline-size;
		transition:
			border-color var(--dur-fast) var(--ease),
			box-shadow var(--dur-fast) var(--ease),
			translate var(--dur-fast) var(--ease-out),
			scale var(--dur-fast) var(--ease-out);
	}
	.r-sm {
		border-radius: var(--r-sm);
	}
	.r-md {
		border-radius: var(--r-md);
	}
	.r-lg {
		border-radius: var(--r-lg);
	}
	.r-pill {
		border-radius: var(--r-pill);
	}
	@media (hover: hover) and (pointer: fine) {
		.hover:hover {
			border-color: var(--surface-edge-strong);
			box-shadow: var(--shadow-md);
			translate: 0 calc(-1 * var(--hover-lift));
		}
	}
	.hover:active {
		scale: var(--press-scale-lg);
		transition-duration: var(--dur-press);
	}
	.img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.fit-cover {
		object-fit: cover;
	}
	.fit-contain {
		object-fit: contain;
	}
	.initials {
		font-size: 28cqw;
		font-weight: var(--fw-semibold);
		letter-spacing: 0.04em;
		color: color-mix(in srgb, var(--text) 55%, transparent);
		user-select: none;
	}
	.glyph {
		font-size: 30cqw;
		display: flex;
		color: color-mix(in srgb, var(--text) 40%, transparent);
	}
	.status {
		position: absolute;
		right: var(--sp-2);
		bottom: var(--sp-2);
		display: flex;
	}
</style>
