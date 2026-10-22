<script module>
	export const meta = {
		title: 'Row actions',
		caption: 'items with icon, tag/tagTone and danger; the trigger snippet is a kebab icon on the default ghost box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Avatar, Icon, Menu, Text, toasts, type MenuItem } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	const members = people.slice(0, 4);

	const actions = (name: string): MenuItem[] => [
		{ label: 'Edit profile', icon: 'edit', onselect: () => toasts.show(`Editing ${name}`) },
		{ label: 'Copy invite link', icon: 'copy', onselect: () => toasts.ok('Invite link copied') },
		{ label: 'Manage access', icon: 'settings', tag: 'admin', tagTone: 'info', onselect: () => toasts.show('Access') },
		{ label: 'Remove from team', icon: 'trash', danger: true, onselect: () => toasts.error(`${name} removed`) }
	];
</script>

<ul class="members">
	{#each members as p (p.handle)}
		<li>
			<Avatar name={p.name} hue={p.hue} glyph={p.emoji} size="sm" />
			<span class="who">
				<Text size="sm" weight="medium" truncate>{p.name}</Text>
				<Text size="xs" tone="muted" truncate>{p.role}</Text>
			</span>
			<Menu label="Actions for {p.name}" items={actions(p.name)} placement="bottom-end" box="sm">
				{#snippet trigger()}<Icon name="more" size={16} />{/snippet}
			</Menu>
		</li>
	{/each}
</ul>

<style>
	.members {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--sp-3);
		padding: var(--sp-2) 0;
		border-bottom: 1px solid var(--border);
	}
	li:last-child {
		border-bottom: 0;
	}
	.who {
		display: grid;
		min-width: 0;
	}
</style>
