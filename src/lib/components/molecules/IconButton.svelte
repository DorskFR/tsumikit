<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	type IconButtonProps = HTMLButtonAttributes & {
		icon: IconName;
		label: string;
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
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
		label,
		title = label,
		variant = 'ghost',
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
	{disabled}
	{title}
	{onclick}
	icon={!inline}
	iconInline={inline}
	{hoverDanger}
	aria-pressed={pressed}
	class={klass}
	aria-label={label}
>
	<Icon name={icon} {size} />
</Button>
