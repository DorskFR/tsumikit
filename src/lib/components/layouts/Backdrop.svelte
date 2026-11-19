<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Full-bleed hero image (an Artwork, so the seeded placeholder and lazy fade-in
	// come for free) that fades into --bg at the bottom. Children sit on a scrim
	// mixed from --bg so text stays readable over any picture.
	import type { Snippet } from 'svelte';
	import Artwork from '../atoms/Artwork.svelte';
	import type { IconName } from '../atoms/Icon.svelte';

	type Own = {
		as?: 'div' | 'header' | 'section';
		src?: string | null;
		srcset?: string;
		sizes?: string;
		alt: string;
		/** Drives the placeholder gradient hue and initials. Defaults to `alt`. */
		seed?: string;
		/** Any CSS length. Defaults to `min(45svh, 22rem)`. */
		height?: string;
		/** Gradient from the image into --bg along the bottom edge. */
		fade?: 'bottom' | 'none';
		/** Soften the picture behind the content. */
		blur?: boolean;
		/** Darken (tint toward --bg) the whole picture, not just the scrim. */
		dim?: boolean;
		fit?: 'cover' | 'contain';
		fallback?: 'initials' | 'icon' | 'none';
		icon?: IconName;
		onerror?: () => void;
		class?: string;
		children?: Snippet;
	};
	let {
		as = 'div',
		src,
		srcset,
		sizes,
		alt,
		seed,
		height,
		fade = 'bottom',
		blur = false,
		dim = false,
		fit = 'cover',
		fallback = 'initials',
		icon = 'image',
		onerror,
		class: klass = '',
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();
</script>

<svelte:element
	this={as}
	data-tsu="Backdrop"
	class="backdrop fade-{fade} {klass}"
	class:blur
	class:dim
	style:min-height={height}
	{...rest}
>
	<div class="media">
		<Artwork {src} {srcset} {sizes} {alt} {seed} {fit} {fallback} {icon} {onerror} aspect="auto" radius="sm" />
	</div>
	{#if children}
		<div class="content">{@render children()}</div>
	{/if}
</svelte:element>

<style>
	.backdrop {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-height: min(45svh, 22rem);
		overflow: hidden;
		background: var(--bg);
		color: var(--text);
	}
	.media {
		position: absolute;
		inset: 0;
	}
	.media > :global([data-tsu='Artwork']) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		border-radius: 0;
	}
	.blur .media > :global([data-tsu='Artwork']) {
		filter: blur(12px);
		scale: 1.08;
	}
	.media::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: linear-gradient(
			to bottom,
			transparent 40%,
			var(--bg) 100%
		);
	}
	.fade-none .media::after {
		background-image: none;
	}
	.dim .media::after {
		background-color: color-mix(in srgb, var(--bg) 35%, transparent);
	}
	.content {
		position: relative;
		padding: var(--sp-6) max(var(--sp-4), var(--safe-left)) var(--sp-4) max(var(--sp-4), var(--safe-right));
		background: color-mix(in srgb, var(--bg) 86%, transparent);
	}
	/* Feather the scrim upward so it never shows a hard edge over the picture. */
	.content::before {
		content: '';
		position: absolute;
		inset: auto 0 100% 0;
		height: var(--sp-12);
		pointer-events: none;
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--bg) 86%, transparent),
			transparent
		);
	}
	@media (prefers-reduced-transparency: reduce) {
		.content {
			background: var(--bg);
		}
		.content::before {
			background: linear-gradient(to top, var(--bg), transparent);
		}
		.blur .media > :global([data-tsu='Artwork']) {
			filter: none;
			scale: 1;
		}
	}
	@media (prefers-contrast: more) {
		.content {
			background: var(--bg);
		}
		.content::before {
			background: linear-gradient(to top, var(--bg), transparent);
		}
		.dim .media::after {
			background-color: color-mix(in srgb, var(--bg) 60%, transparent);
		}
	}
</style>
