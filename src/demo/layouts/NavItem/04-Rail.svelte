<script module>
	export const meta = {
		title: 'Icon rail and tab orientation',
		caption: 'Inside a sidebar query container at 8rem or less the label hides and the badge becomes a dot; orientation="vertical" stacks icon over label for bottom tabs.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Cluster, NavItem, Stack } from '@dorsk/tsumikit';
</script>

<Stack gap="var(--sp-0-5)" class="nav-item-rail">
	<NavItem icon="home" label="Home" active />
	<NavItem icon="mail" label="Inbox" badge={12} />
	<NavItem icon="calendar" label="Calendar" badge={2} badgeTone="warn" />
	<NavItem icon="settings" label="Settings" />
</Stack>
<Cluster gap="var(--sp-1)">
	<NavItem icon="home" label="Home" orientation="vertical" active />
	<NavItem icon="search" label="Search" orientation="vertical" />
	<NavItem icon="bell" label="Alerts" orientation="vertical" badge={5} badgeTone="danger" />
	<NavItem icon="user" label="Profile" orientation="vertical" />
</Cluster>

<style>
	:global(.nav-item-rail) {
		container: sidebar / inline-size;
		width: 4.5rem;
		padding: var(--sp-1);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elevated);
	}
</style>
