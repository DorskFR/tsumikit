<script lang="ts">
	// Selection-card option — a bordered card that gains a colored ring + tint
	// when `selected`. The accent is driven by `--opt-accent` (default accent),
	// so each picker recolors per use (blue for run-target, brand color for the
	// adapter, green/blue/red for permission mode). `row` lays the content out
	// horizontally (icon + label) instead of the default label-over-hint column.
	//
	// Thin wrapper over the Button atom's `option` variant: Button owns the card
	// surface + selection ring styling (keyed off `selected`/`row`), so nothing
	// is styled from here — just prop pass-through.
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	let {
		selected = false,
		row = false,
		class: klass = '',
		children,
		...rest
	}: {
		selected?: boolean;
		row?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<Button {...rest} variant="option" {selected} {row} aria-pressed={selected} class={klass}>
	{@render children?.()}
</Button>
