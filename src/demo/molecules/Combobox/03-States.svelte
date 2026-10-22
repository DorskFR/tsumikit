<script module>
	export const meta = {
		title: 'States',
		caption: 'an empty snippet, a disabled field, loop={false} with homeEnd, selectOn={["Enter"]} so Tab leaves the field, and placement="top-start".',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Combobox, Input, Spinner, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const names = services.map((s) => s.name);
	let q1 = $state('zzz');
	let open1 = $state(false);
	let q2 = $state('');
	let open2 = $state(false);
	let q3 = $state('');
	let open3 = $state(false);
	const m1 = $derived(names.filter((n) => n.includes(q1.trim().toLowerCase())));
	const m2 = $derived(names.filter((n) => n.includes(q2.trim().toLowerCase())));
	const m3 = $derived(names.filter((n) => n.includes(q3.trim().toLowerCase())));
</script>

{#snippet searching()}
	<span class="empty"><Spinner size={14} /> <Text size="sm" tone="muted">Searching the fleet for “{q1}”…</Text></span>
{/snippet}

<div class="list">
	<Combobox options={m1} bind:open={open1} label="Services" empty={searching} onselect={(n) => (q1 = n)}>
		<Input bind:value={q1} mono placeholder="Service name" aria-label="Empty state" oninput={() => (open1 = true)} onfocus={() => (open1 = true)} />
	</Combobox>
	<Combobox options={names} label="Services" onselect={() => {}}>
		<Input disabled value="api-gateway" mono aria-label="Disabled" />
	</Combobox>
	<Combobox options={m2} bind:open={open2} label="Services" loop={false} homeEnd selectOn={['Enter']} onselect={(n) => (q2 = n)}>
		<Input bind:value={q2} mono placeholder="No wrap, Home and End jump, Tab leaves" aria-label="Keyboard options" oninput={() => (open2 = true)} onfocus={() => (open2 = true)} />
	</Combobox>
	<Combobox options={m3} bind:open={open3} label="Services" placement="top-start" onselect={(n) => (q3 = n)}>
		<Input bind:value={q3} mono placeholder="Opens upward" aria-label="Top placement" oninput={() => (open3 = true)} onfocus={() => (open3 = true)} />
	</Combobox>
</div>

<style>
	.list {
		display: grid;
		gap: var(--sp-3);
		max-width: 22rem;
	}
	.empty {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
	}
</style>
