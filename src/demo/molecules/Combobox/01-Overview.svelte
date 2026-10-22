<script module>
	export const meta = {
		title: 'Assignee picker',
		caption: 'options filtered from the query, bind:open and bind:index, an option snippet with Avatar, empty text and onselect.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Combobox, Input, Text } from '@dorsk/tsumikit';
	import { people, type Person } from '../../fixtures';

	let query = $state('');
	let open = $state(false);
	let index = $state(0);
	let assignee = $state<Person | null>(null);
	const matches = $derived(
		people.filter((p) => `${p.name} ${p.handle}`.toLowerCase().includes(query.trim().toLowerCase()))
	);
</script>

<div class="picker">
	<Combobox
		options={matches}
		bind:open
		bind:index
		label="Assignee suggestions"
		getKey={(p) => p.handle}
		getLabel={(p) => p.name}
		empty="No member matches"
		onselect={(p) => {
			assignee = p;
			query = p.name;
		}}
	>
		{#snippet option(p, { active })}
			<span class="row" class:active>
				<Avatar name={p.name} glyph={p.emoji} hue={p.hue} size="xs" decorative />
				<Text size="sm">{p.name}</Text>
				<Text size="xs" tone="muted">@{p.handle} · {p.role}</Text>
			</span>
		{/snippet}
		<Input
			bind:value={query}
			icon="user"
			placeholder="Assign to…"
			aria-label="Assignee"
			oninput={() => (open = true)}
			onfocus={() => (open = true)}
		/>
	</Combobox>
	<Text size="xs" tone="muted">{assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}</Text>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--sp-2);
		max-width: 22rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.active {
		font-weight: var(--fw-semibold);
	}
</style>
