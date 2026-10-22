<script module>
	export const meta = {
		title: 'Full-height sidebar',
		caption: 'layout="sidebar-full" runs the sidebar the whole height with the brand at its top; the header only spans the content column. sidebarPadding="sm".',
		layout: 'frame',
		height: '24rem'
	};
</script>

<script lang="ts">
	import { AppShell, Button, Container, Heading, NavItem, NavSection, Stack, Text } from '@dorsk/tsumikit';
	import { tracks } from '../../fixtures';

	let current = $state('library');
</script>

<AppShell layout="sidebar-full" sidebarWidth="14rem" sidebarPadding="sm" style="min-height: 100%; --z-header: 1">
	{#snippet header()}
		<Heading level={2} size="md">Library</Heading>
		<span style="flex: 1"></span>
		<Button size="sm" variant="primary">Import</Button>
	{/snippet}
	{#snippet sidebar()}
		<Stack gap="var(--sp-3)">
			<Text weight="bold" style="padding: var(--sp-2) var(--sp-3)">♫ Kusari</Text>
			<NavSection label="Listen">
				<NavItem icon="home" label="Home" active={current === 'home'} onclick={() => (current = 'home')} />
				<NavItem icon="disc" label="Library" active={current === 'library'} onclick={() => (current = 'library')} />
				<NavItem icon="heart" label="Liked" badge={42} onclick={() => (current = 'liked')} active={current === 'liked'} />
			</NavSection>
		</Stack>
	{/snippet}
	<Container size="none" pad>
		<Stack gap="var(--sp-2)">
			{#each tracks as track (track.id)}
				<Text>{track.title} <Text tone="muted">· {track.artist} · {track.album}</Text></Text>
			{/each}
		</Stack>
	</Container>
</AppShell>
