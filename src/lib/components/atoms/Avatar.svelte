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
		style: styleProp,
		...rest
	}: Omit<HTMLAttributes<HTMLSpanElement>, keyof Own> & Own = $props();

	const text = $derived(glyph?.trim() || avatarInitial(name) || '?');
	const hashed = $derived(tone === undefined);
	const hidden = $derived(decorative || !name.trim());
	const resolvedHue = $derived(hashed ? (hue ?? avatarHue(seed ?? name)) : undefined);
	// The fill carries the identity; the initial is theme ink with a hue tint.
	// These ratios are the ones that clear 4.5:1 at every hue on every bundled
	// theme (see tests/avatar-contract.test.js).
	const hueStyle = $derived(
		resolvedHue === undefined
			? ''
			: `background: color-mix(in srgb, hsl(${resolvedHue} var(--mach-bg-sl)) 70%, var(--bg)); color: color-mix(in srgb, hsl(${resolvedHue} var(--mach-fg-sl)) 25%, var(--text));`
	);
	const sizeStyle = $derived.by(() => {
		if (typeof size !== 'number') return '';
		const box = `width: ${size}px; height: ${size}px; font-size: calc(${size}px * ${glyph === undefined ? 0.46 : 0.72});`;
		return shape === 'square' ? `${box} border-radius: calc(${size}px / 4);` : box;
	});
	const inline = $derived(sizeStyle + hueStyle);
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
	style={inline + (styleProp ?? '') || undefined}
	role={hidden ? undefined : 'img'}
	aria-label={hidden ? undefined : name}
	aria-hidden={hidden ? 'true' : undefined}
	{...rest}
>
	<span class="text" aria-hidden="true">{text}</span>
	{#if status}
		<span class="status">{@render status()}</span>
	{/if}
</span>

<style>
	.avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2rem;
		height: 2rem;
		border-radius: var(--r-pill);
		font-weight: var(--fw-semibold);
		font-size: calc(2rem * 0.46);
		line-height: var(--lh-none);
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		user-select: none;
		vertical-align: middle;
	}
	.size-xs {
		width: 1.25rem;
		height: 1.25rem;
		font-size: calc(1.25rem * 0.46);
	}
	.size-sm {
		width: 1.5rem;
		height: 1.5rem;
		font-size: calc(1.5rem * 0.46);
	}
	.size-lg {
		width: 2.5rem;
		height: 2.5rem;
		font-size: calc(2.5rem * 0.46);
	}
	.square {
		border-radius: calc(2rem / 4);
	}
	.square.size-xs {
		border-radius: calc(1.25rem / 4);
	}
	.square.size-sm {
		border-radius: calc(1.5rem / 4);
	}
	.square.size-lg {
		border-radius: calc(2.5rem / 4);
	}
	.accent {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		color: var(--accent);
	}
	.bare {
		background: none;
		color: inherit;
	}
	.glyph {
		font-size: calc(2rem * 0.72);
		font-weight: var(--fw-normal);
	}
	.glyph.size-xs {
		font-size: calc(1.25rem * 0.72);
	}
	.glyph.size-sm {
		font-size: calc(1.5rem * 0.72);
	}
	.glyph.size-lg {
		font-size: calc(2.5rem * 0.72);
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
		box-shadow: 0 0 0 2px var(--bg-elevated);
	}
</style>
