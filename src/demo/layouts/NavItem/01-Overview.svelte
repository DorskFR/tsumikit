<script module>
	export const meta = {
		title: 'Mail folders',
		caption: 'active marks the current folder and takes the accent badge; badge counts hide at 0.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavItem, Stack, type IconName } from '@dorsk/tsumikit';

	const folders: { id: string; label: string; icon: IconName; count: number }[] = [
		{ id: 'inbox', label: 'Inbox', icon: 'mail', count: 12 },
		{ id: 'starred', label: 'Starred', icon: 'star', count: 0 },
		{ id: 'snoozed', label: 'Snoozed', icon: 'clock', count: 3 },
		{ id: 'sent', label: 'Sent', icon: 'send', count: 0 },
		{ id: 'archive', label: 'Archive', icon: 'archive', count: 0 },
		{ id: 'trash', label: 'Trash', icon: 'trash', count: 0 }
	];
	let current = $state('inbox');
</script>

<Stack as="nav" gap="var(--sp-0-5)" aria-label="Mail folders" style="max-width: 15rem">
	{#each folders as folder (folder.id)}
		<NavItem
			icon={folder.icon}
			label={folder.label}
			badge={folder.count}
			active={current === folder.id}
			onclick={() => (current = folder.id)}
		/>
	{/each}
</Stack>
