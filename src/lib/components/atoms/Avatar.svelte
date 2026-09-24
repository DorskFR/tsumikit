<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { avatarHue, avatarInitial } from '$lib/avatar';

	type Own = {
		name?: string;
		/** Emoji or character shown instead of the initial. */
		glyph?: string;
		/** Seeds the hashed hue. Defaults to `name`. */
		seed?: string;
		/** Explicit hue (0–359); overrides `seed`. */
		hue?: number;
		/** Fixed palette instead of the hashed hue; `none` drops the fill. */
		tone?: 'accent' | 'neutral' | 'none';
		/** Preset box, or a pixel size. */
		size?: 'xs' | 'sm' | 'md' | 'lg' | number;
		shape?: 'circle' | 'square';
		/** `aria-hidden` when the surrounding element already names the person. */
		decorative?: boolean;
		/** Overlay pinned to the top-right corner (a Dot). */
		status?: Snippet;
		class?: string;
	};
	let {
		name = '',
		glyph,
		seed,
		hue,
		tone,
		size = 'md',
		shape = 'circle',
		decorative = false,
		status,
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	const text = $derived(glyph?.trim() || avatarInitial(name) || '?');
	const hashed = $derived(tone === undefined);
	const resolvedHue = $derived(hashed ? (hue ?? avatarHue(seed ?? name)) : undefined);
</script>

<span
	data-tsu="Avatar"
	class="avatar {klass}"
	class:hued={hashed}
	class:accent={tone === 'accent'}
	class:neutral={tone === 'neutral'}
	class:bare={tone === 'none'}
	class:square={shape === 'square'}
	class:glyph={glyph !== undefined}
	class:size-xs={size === 'xs'}
	class:size-sm={size === 'sm'}
	class:size-lg={size === 'lg'}
	style:--avatar-size={typeof size === 'number' ? `${size}px` : undefined}
	style:--avatar-hue={resolvedHue}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : name}
	aria-hidden={decorative ? 'true' : undefined}
	{...rest}
>
	<span class="text" aria-hidden="true">{text}</span>
	{#if status}
		<span class="status">{@render status()}</span>
	{/if}
</span>

<style>
	.avatar {
		--avatar-size: 2rem;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: var(--avatar-size);
		height: var(--avatar-size);
		border-radius: var(--r-pill);
		font-weight: var(--fw-semibold);
		font-size: calc(var(--avatar-size) * 0.46);
		line-height: 1;
		background: var(--avatar-bg, var(--bg-elevated-2));
		color: var(--avatar-fg, var(--text-muted));
		user-select: none;
		vertical-align: middle;
	}
	.size-xs {
		--avatar-size: 1.25rem;
	}
	.size-sm {
		--avatar-size: 1.5rem;
	}
	.size-lg {
		--avatar-size: 2.5rem;
	}
	.square {
		border-radius: calc(var(--avatar-size) / 4);
	}
	/* The fill carries the identity; the initial is theme ink with a hue tint.
	   These ratios are the ones that clear 4.5:1 at every hue on every bundled
	   theme (see tests/avatar-contract.test.js). */
	.hued {
		background: var(
			--avatar-bg,
			color-mix(in srgb, hsl(var(--avatar-hue) var(--mach-bg-sl)) 70%, var(--bg))
		);
		color: var(
			--avatar-fg,
			color-mix(in srgb, hsl(var(--avatar-hue) var(--mach-fg-sl)) 25%, var(--text))
		);
	}
	.accent {
		background: var(--avatar-bg, color-mix(in srgb, var(--accent) 18%, transparent));
		color: var(--avatar-fg, var(--accent));
	}
	.bare {
		background: var(--avatar-bg, none);
		color: var(--avatar-fg, inherit);
	}
	.glyph {
		font-size: calc(var(--avatar-size) * 0.72);
		font-weight: var(--fw-normal);
	}
	.text {
		display: block;
		overflow: hidden;
		white-space: nowrap;
	}
	.status {
		position: absolute;
		top: 0;
		right: 0;
		display: inline-flex;
		line-height: 0;
		border-radius: var(--r-pill);
		transform: translate(25%, -25%);
		box-shadow: 0 0 0 2px var(--avatar-status-ring, var(--bg-elevated));
	}
</style>
