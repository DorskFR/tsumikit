<script module>
	export const meta = {
		title: 'Workspace sidebar',
		caption: 'An unlabelled top group, then label="Library" and label="System"; each labelled group is a role="group" named by its label.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavItem, NavSection } from '@dorsk/tsumikit';
	import { groups } from './data';

	let current = $state('files');
</script>

<nav aria-label="Workspace" style="max-width: 15rem">
	{#each groups as group (group.label ?? 'top')}
		<NavSection label={group.label}>
			{#each group.items as item (item.id)}
				<NavItem
					icon={item.icon}
					label={item.label}
					badge={item.badge}
					badgeTone={item.tone}
					active={current === item.id}
					onclick={() => (current = item.id)}
				/>
			{/each}
		</NavSection>
	{/each}
</nav>
