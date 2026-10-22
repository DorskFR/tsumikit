<script module>
	export const meta = {
		title: 'Podcast app bottom navigation',
		caption: 'Button items make a tablist driven by bind:value; variant="floating" insets the bar and center holds a raised record button.',
		layout: 'center'
	};
</script>

<script lang="ts">
	import { Heading, IconButton, NavBar, Stack, Text, type NavBarItem } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	const items: NavBarItem[] = [
		{ value: 'home', label: 'Home', icon: 'home' },
		{ value: 'search', label: 'Search', icon: 'search' },
		{ value: 'library', label: 'Library', icon: 'disc', badge: 3 },
		{ value: 'profile', label: 'Profile', icon: 'user' }
	];
	let view = $state('library');
</script>

<div class="phone">
	<Stack gap="var(--sp-2)" style="padding: var(--sp-4); flex: 1; overflow-y: auto">
		<Heading level={3} size="md">{items.find((i) => i.value === view)?.label}</Heading>
		{#each tracks as track (track.id)}
			<Text size="sm">{track.title} <Text tone="muted">· {track.artist}</Text></Text>
		{/each}
	</Stack>
	<NavBar
		{items}
		bind:value={view}
		label="Podcast sections"
		variant="floating"
		style="--navbar-center-raise: 1.25rem"
	>
		{#snippet center()}
			<IconButton icon="plus" label="New recording" variant="primary" pill box="lg" />
		{/snippet}
	</NavBar>
</div>

<style>
	.phone {
		display: flex;
		flex-direction: column;
		width: 22rem;
		max-width: 100%;
		height: 30rem;
		border: 1px solid var(--border);
		border-radius: var(--r-lg);
		background: var(--bg);
		overflow: hidden;
	}
</style>
