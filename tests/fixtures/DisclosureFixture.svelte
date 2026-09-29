<script lang="ts">
	import Accordion from '../../src/lib/components/molecules/Accordion.svelte';
	import type { AccordionItem } from '../../src/lib/components/molecules/Accordion.svelte';
	import Disclosure from '../../src/lib/components/molecules/Disclosure.svelte';

	let {
		open = $bindable(false),
		chevron = 'end',
		onchange,
		multiple = true,
		itemOpen = {},
		onItemChange,
		onItem,
		size = 'default',
		variant = 'default'
	}: {
		open?: boolean;
		chevron?: 'start' | 'end' | false;
		onchange?: (open: boolean) => void;
		multiple?: boolean;
		itemOpen?: Record<string, boolean>;
		onItemChange?: (id: string, open: boolean) => void;
		onItem?: (id: string, open: boolean) => void;
		size?: 'default' | 'compact';
		variant?: 'default' | 'plain';
	} = $props();

	const items = $derived<AccordionItem[]>([
		{ id: 'a', title: 'Alpha', content: body, open: itemOpen.a, onchange: (o) => onItem?.('a', o) },
		{ id: 'b', summary: rich, content: body, open: itemOpen.b, onchange: (o) => onItem?.('b', o) },
		{ id: 'c', title: 'Gamma', content: body, open: itemOpen.c, onchange: (o) => onItem?.('c', o) }
	]);
</script>

{#snippet body()}
	<p class="probe-body">body</p>
{/snippet}

{#snippet rich({ open, item }: { open: boolean; item: AccordionItem })}
	<span class="probe-rich">Beta</span><span class="probe-state">{open ? 'on' : 'off'}</span><span
		class="probe-item">{item.id}</span
	>
{/snippet}

<Disclosure id="probe" bind:open {chevron} {size} {onchange}>
	{#snippet header({ open })}
		<span class="probe-header">Details</span><span class="probe-header-state">{open ? 'on' : 'off'}</span>
	{/snippet}
	<p class="probe-panel">panel</p>
</Disclosure>

<Accordion {items} {multiple} {size} {variant} onchange={onItemChange} />
