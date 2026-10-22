<script module>
	export const meta = {
		title: 'Orientation and chrome',
		caption: 'orientation="stacked" | "inline"; variant="flush" | "floating"; maxWidth caps and centres the row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { NavBar, Stack, Text, type NavBarItem } from '@dorsk/tsumikit';

	const items: NavBarItem[] = [
		{ value: 'overview', label: 'Overview', icon: 'home' },
		{ value: 'deploys', label: 'Deploys', icon: 'git-commit', badge: 2 },
		{ value: 'logs', label: 'Logs', icon: 'file-text' },
		{ value: 'settings', label: 'Settings', icon: 'settings' }
	];
	const rows = [
		{ caption: 'stacked · flush', orientation: 'stacked', variant: 'flush' },
		{ caption: 'inline · flush', orientation: 'inline', variant: 'flush' },
		{ caption: 'stacked · floating · maxWidth="24rem"', orientation: 'stacked', variant: 'floating', maxWidth: '24rem' }
	] as const;
	let value = $state('deploys');
</script>

{#each rows as row (row.caption)}
	<Stack gap="var(--sp-1)">
		<Text size="xs" mono tone="muted">{row.caption}</Text>
		<NavBar
			{items}
			bind:value
			label="Project, {row.caption}"
			orientation={row.orientation}
			variant={row.variant}
			maxWidth={'maxWidth' in row ? row.maxWidth : undefined}
		/>
	</Stack>
{/each}
