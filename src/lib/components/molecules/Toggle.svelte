<script lang="ts">
	// Toggle chip — a muted pill/chip that lights up (tinted) when `pressed`.
	// The "on" tint is driven by the `--toggle-accent` CSS var (default accent),
	// so callers recolor it per-use (e.g. warm for behavior, role color for
	// message-type filters) without restyling the base. Used across the
	// conversation toolbar (filters / formatting / behavior / mobile tabs).
	//
	// Thin wrapper over the Button atom's `toggle` variant: Button owns the chip
	// surface + "on" tint (keyed off `selected`/`pill`/`struck`), so nothing is
	// styled from here — just prop pass-through.
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	let {
		pressed = false,
		pill = false,
		struck = false,
		class: klass = '',
		children,
		...rest
	}: {
		pressed?: boolean;
		pill?: boolean;
		struck?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<Button
	{...rest}
	variant="toggle"
	selected={pressed}
	{pill}
	{struck}
	aria-pressed={pressed}
	class={klass}
>
	{@render children?.()}
</Button>
