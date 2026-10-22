<script module>
	export const meta = {
		title: 'Full width and icon rail',
		caption: 'The same groups in a sidebar query container at 15rem and at 4.5rem: labels give way to dividers, badges to dots.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { NavItem, NavSection } from '@dorsk/tsumikit';
	import { groups } from './data';

	const widths = ['15rem', '4.5rem'];
</script>

{#each widths as width (width)}
	<nav aria-label="Workspace at {width}" class="nav-section-sidebar" style="width: {width}">
		{#each groups as group (group.label ?? 'top')}
			<NavSection label={group.label}>
				{#each group.items as item (item.id)}
					<NavItem
						icon={item.icon}
						label={item.label}
						badge={item.badge}
						badgeTone={item.tone}
						active={item.id === 'files'}
					/>
				{/each}
			</NavSection>
		{/each}
	</nav>
{/each}

<style>
	:global(.nav-section-sidebar) {
		container: sidebar / inline-size;
		max-width: 100%;
		align-self: flex-start;
		padding: var(--sp-2);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elevated);
	}
</style>
