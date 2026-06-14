<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	type IconButtonProps = HTMLButtonAttributes & {
		/** Named glyph from the registry. Omit when supplying `children`. */
		icon?: IconName;
		/** Raw SVG markup (24×24 viewBox) — overrides `icon`. Pass a
		 *  lucide-svelte component's contents to render any off-registry icon. */
		children?: Snippet;
		label: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		// Semantic state tint (forwarded to Button). Pairs well with `chip`.
		tone?: 'none' | 'accent' | 'info' | 'warn' | 'danger';
		// Larger 2.5rem outlined square icon-chip (header/toolbar actions).
		chip?: boolean;
		size?: number;
		// Borderless, compact icon affordance (chip-remove ✕, inline edit ✎) —
		// no square box; just a muted glyph that brightens on hover. Pair with
		// `hoverDanger` to tint it red on hover (delete affordances).
		inline?: boolean;
		hoverDanger?: boolean;
		// Two-state icon toggle (star/pin/favourite): sets `aria-pressed` and tints
		// the glyph with the accent when on. Override the tint per-instance with
		// `style="--btn-on: var(--warn)"`.
		pressed?: boolean;
		class?: string;
	};

	let {
		icon,
		children,
		label,
		title = label,
		variant = 'ghost',
		tone = 'none',
		chip = false,
		size = 18,
		inline = false,
		hoverDanger = false,
		pressed,
		disabled = false,
		onclick,
		class: klass = '',
		...rest
	}: IconButtonProps = $props();
</script>

<!-- Composition: the icon-only button is a Button (canonical control styling)
     in its icon variant, wrapping an Icon. -->
<Button
	{...rest}
	{variant}
	{tone}
	{chip}
	{disabled}
	{title}
	{onclick}
	icon={!inline && !chip}
	iconInline={inline}
	{hoverDanger}
	aria-pressed={pressed}
	class={klass}
	aria-label={label}
>
	{#if children}
		<Icon {size}>{@render children()}</Icon>
	{:else}
		<Icon name={icon} {size} />
	{/if}
</Button>
