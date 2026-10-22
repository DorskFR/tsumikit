<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import SegmentedControl, { type SegmentOption } from '$lib/components/molecules/SegmentedControl.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { LOOKS, type LookId } from '$lib/theme-mode';

	let {
		looks,
		experimental = true,
		experimentalLabel = 'beta',
		label = 'Look',
		size = 'md',
		control,
		block,
		scroll,
		sound,
		onchange,
		class: klass = '',
	}: Pick<ComponentProps<typeof SegmentedControl>, 'size' | 'control' | 'block' | 'scroll' | 'sound'> & {
		/** Restrict and order the offered looks; defaults to every registered look. */
		looks?: readonly LookId[];
		/** Offer looks whose status is `experimental`. */
		experimental?: boolean;
		/** Badge on experimental looks; empty hides it. */
		experimentalLabel?: string;
		label?: string;
		onchange?: (look: LookId) => void;
		class?: string;
	} = $props();

	const options = $derived(
		(looks ?? LOOKS.map((l) => l.id)).flatMap((id) => {
			const l = LOOKS.find((x) => x.id === id);
			const beta = l?.status === 'experimental';
			if (!l || (beta && !experimental)) return [];
			return [{ value: l.id, label: l.label }];
		})
	);
	const tagged = new Set<string>(LOOKS.filter((l) => l.status === 'experimental').map((l) => l.id));
</script>

{#snippet option(o: SegmentOption)}
	<span class="look">
		<span class="name">{o.label}</span>
		{#if experimentalLabel && tagged.has(o.value)}<span class="tag">{experimentalLabel}</span>{/if}
	</span>
{/snippet}

<SegmentedControl
	{options}
	value={theme.look}
	onchange={(v) => {
		theme.setLook(v);
		onchange?.(theme.look);
	}}
	{label}
	{size}
	{control}
	{block}
	{scroll}
	{sound}
	class="look-picker {klass}"
	{option}
/>

<style>
	.look {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		min-width: 0;
	}
	:global(.seg-block) .name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tag {
		flex: none;
		padding: 0 var(--sp-1);
		border: 1px solid currentColor;
		border-radius: var(--r-pill);
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-tight);
	}
</style>
