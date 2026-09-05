<script lang="ts">
	import type { Tone } from '$lib/tone';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	type IconButtonProps = HTMLButtonAttributes & {
		/** Named glyph from the registry (rendered as SVG). */
		icon?: IconName;
		/** Off-registry glyph such as an emoji, rendered as text as-is. Use instead
		 *  of `icon` when the glyph isn't in the registry. */
		emoji?: string;
		/** Raw SVG markup (24×24 viewBox) — overrides `icon`. Pass a
		 *  lucide-svelte component's contents to render any off-registry icon. */
		children?: Snippet;
		label: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		// Fully rounded (`--r-pill`) box. Forwarded to Button.
		pill?: boolean;
		// `shrink={false}` pins the box to its intrinsic size in a flex row.
		// Forwarded to Button.
		shrink?: boolean;
		// Semantic state tint (forwarded to Button). Pairs well with `chip`.
		tone?: Tone | 'none';
		// Outlined `--box-lg` square icon-chip (header/toolbar actions).
		chip?: boolean;
		// Shared square box scale (`--box-xs/sm/md/lg`); default `md` is the classic
		// 2.25rem box. Forwarded to Button.
		box?: 'xs' | 'sm' | 'md' | 'lg';
		// SVG glyph px. Emoji text glyphs render at ×1.35 of it.
		size?: number;
		// Exact glyph size for SVG *and* text glyphs (px number or any CSS length),
		// no emoji multiplier. Wins over `size`.
		glyphSize?: number | string;
		// Opt out of the 44px coarse-pointer hit slab in dense rows.
		hitArea?: 'auto' | 'compact';
		// Borderless, compact icon affordance (chip-remove ✕, inline edit ✎) —
		// no square box; just a muted glyph that brightens on hover. Pair with
		// `hoverDanger` to tint it red on hover (delete affordances).
		inline?: boolean;
		hoverDanger?: boolean;
		// Two-state icon toggle (star/pin/favourite): sets `aria-pressed` and tints
		// the glyph with the accent when on. Override the tint per-instance with
		// `style="--btn-on: var(--warn)"`.
		pressed?: boolean;
		// Render as a link (`<a href>`) while keeping icon-button chrome — e.g. an
		// open-on-GitHub action. Forwarded to Button; `href` implies `as="a"`.
		as?: 'button' | 'a';
		href?: string;
		/** Render `label` as visible text beside the glyph. `row` is a full-width,
		 *  left-aligned menu-row form for overflow menus. */
		showLabel?: boolean | 'row';
		/** Rotate the glyph (refresh in flight). */
		spin?: boolean;
		/** Forwarded to Button: spinner, blocks clicks, aria-busy. */
		loading?: boolean;
		class?: string;
	};

	let {
		icon,
		emoji,
		children,
		label,
		title = label,
		variant = 'ghost',
		tone = 'none',
		chip = false,
		pill = false,
		shrink = true,
		box,
		size = 18,
		glyphSize,
		hitArea = 'auto',
		inline = false,
		hoverDanger = false,
		pressed,
		showLabel = false,
		spin = false,
		loading = false,
		disabled = false,
		onclick,
		class: klass = '',
		...rest
	}: IconButtonProps = $props();

	const glyphCss = $derived(
		glyphSize === undefined ? undefined : typeof glyphSize === 'number' ? `${glyphSize}px` : glyphSize
	);
	const emojiCss = $derived(glyphCss ?? `${size * 1.35}px`);
</script>

<!-- Composition: the icon-only button is a Button (canonical control styling)
     in its icon variant, wrapping an Icon (or a text emoji glyph). -->
<Button
	data-tsu="IconButton"
	{...rest}
	{variant}
	{tone}
	{chip}
	{pill}
	{shrink}
	{box}
	{hitArea}
	{disabled}
	{loading}
	{title}
	{onclick}
	icon={!inline && !chip && !showLabel}
	iconInline={inline}
	block={showLabel === 'row'}
	{hoverDanger}
	aria-pressed={pressed}
	class="{showLabel ? 'ib-labelled' : ''} {showLabel === 'row' ? 'ib-row' : ''} {klass}"
	aria-label={label}
>
	{#if children}
		{#if glyphCss}
			<span class="glyph" style="font-size: {glyphCss}"><Icon {spin}>{@render children()}</Icon></span>
		{:else}
			<Icon {size} {spin}>{@render children()}</Icon>
		{/if}
	{:else if emoji}
		<span class="emoji" style="font-size: {emojiCss}" aria-hidden="true">{emoji}</span>
	{:else if icon}
		{#if glyphCss}
			<span class="glyph" style="font-size: {glyphCss}"><Icon name={icon} {spin} /></span>
		{:else}
			<Icon name={icon} {size} {spin} />
		{/if}
	{/if}
	{#if showLabel}<span class="ib-label">{label}</span>{/if}
</Button>

<style>
	/* Off-registry glyph (emoji) rendered as text rather than an SVG. Sized off the
	   `size` prop (×1.35, since an emoji reads small next to an SVG glyph of the
	   same px) unless `glyphSize` is exact; centered so it shares the tap target. */
	.ib-label {
		white-space: nowrap;
	}
	:global(.btn.ib-labelled) {
		gap: var(--sp-2);
	}
	:global(.btn.ib-row) {
		justify-content: flex-start;
		width: 100%;
		text-align: left;
	}
	.emoji,
	.glyph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
</style>
