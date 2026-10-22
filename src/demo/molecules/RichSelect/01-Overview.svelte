<script module>
	export const meta = {
		title: 'Spawn profile picker',
		caption: 'option card snippet, trailing gear, onreorder (drag the grip or Alt+↑/↓), a footer button and bind:value.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, IconButton, RichSelect, Text } from '@dorsk/tsumikit';
	import { PROFILES, type Profile } from './profiles';

	let profiles = $state<Profile[]>(PROFILES.map((p) => ({ ...p })));
	let value = $state<string | number | undefined>('daily');
	let editing = $state('');

	function reorder(from: number, to: number) {
		const next = [...profiles];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		profiles = next;
	}
</script>

<div class="picker">
	<RichSelect
		label="Spawn profile"
		options={profiles}
		bind:value
		getKey={(p) => p.id}
		getLabel={(p) => p.name}
		onreorder={reorder}
	>
		{#snippet option({ option })}
			<span class="profile">
				<span class="profile-text">
					<Text size="sm" weight="medium" truncate>{option.name}</Text>
					<Text size="xs" tone="muted" mono truncate>{option.model} · {option.machine}</Text>
				</span>
				<Badge tone={option.badge.tone}>{option.badge.label}</Badge>
			</span>
		{/snippet}
		{#snippet trailing({ option })}
			<IconButton icon="settings" label="Edit {option.name}" box="sm" onclick={() => (editing = option.name)} />
		{/snippet}
		{#snippet footer({ close })}
			<Button
				variant="ghost"
				size="sm"
				block
				onclick={() => {
					editing = 'a new profile';
					close();
				}}>+ New profile</Button
			>
		{/snippet}
	</RichSelect>
	<Text size="xs" tone="muted">{editing ? `Editing ${editing}` : `Spawning with ${value}`}</Text>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--sp-2);
		max-width: 22rem;
	}
	.profile {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.profile-text {
		display: grid;
		flex: 1 1 auto;
		min-width: 0;
		gap: var(--sp-0-5);
	}
</style>
