<script module>
	export const meta = {
		title: 'Chat app tabs',
		caption: 'placement="inline" so it sits in this phone frame (the default "bar" fixes it to the viewport bottom); each tab controls its panel.',
		layout: 'center'
	};
</script>

<script lang="ts">
	import { Avatar, Cluster, Stack, TabBar, Text, type TabBarItem } from '@dorsk/tsumikit';
	import { people } from '../../fixtures';

	const items: TabBarItem[] = [
		{ id: 'chats', label: 'Chats', icon: 'mail', badge: 4, controls: 'tabbar-chats' },
		{ id: 'people', label: 'People', icon: 'users', controls: 'tabbar-people' },
		{ id: 'calls', label: 'Calls', icon: 'bell', badge: 1, controls: 'tabbar-calls' },
		{ id: 'settings', label: 'Settings', icon: 'settings', controls: 'tabbar-settings' }
	];
	let tab = $state('chats');
</script>

<div class="phone">
	<div id="tabbar-{tab}" role="tabpanel" class="screen">
		<Stack gap="var(--sp-3)">
			{#each tab === 'chats' || tab === 'people' ? people : people.slice(0, 1) as person (person.handle)}
				<Cluster wrap={false}>
					<Avatar name={person.name} hue={person.hue} size="sm" />
					<Stack gap="0" style="min-width: 0">
						<Text weight="semibold" truncate>{person.name}</Text>
						<Text size="xs" tone="muted" truncate>{tab === 'chats' ? 'See you at standup' : person.role}</Text>
					</Stack>
				</Cluster>
			{/each}
		</Stack>
	</div>
	<TabBar {items} bind:value={tab} placement="inline" label="Chat sections" />
</div>

<style>
	.phone {
		display: flex;
		flex-direction: column;
		width: 22rem;
		max-width: 100%;
		height: 28rem;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		background: var(--bg);
		overflow: hidden;
	}
	.screen {
		flex: 1;
		overflow-y: auto;
		padding: var(--sp-4);
	}
</style>
