<script module>
	export const meta = {
		title: 'Icon rail and drawer state',
		caption: 'sidebarWidth="4.5rem" keeps the desktop sidebar a rail (tablets get one automatically); bind:open exposes the phone drawer, which closes on Escape, the scrim or a link tap.',
		layout: 'frame',
		height: '22rem'
	};
</script>

<script lang="ts">
	import { AppShell, Button, Container, Heading, NavItem, NavSection, Stack, Text } from '@dorsk/tsumikit';

	let open = $state(false);
	let current = $state('chat');
</script>

<AppShell sidebarWidth="4.5rem" sidebarPadding="sm" bind:open style="min-height: 100%; --z-header: 1">
	{#snippet header()}
		<Heading level={2} size="md">Support desk</Heading>
	{/snippet}
	{#snippet sidebar()}
		<NavSection>
			<NavItem icon="mail" label="Conversations" badge={9} active={current === 'chat'} onclick={() => (current = 'chat')} />
			<NavItem icon="users" label="Customers" active={current === 'people'} onclick={() => (current = 'people')} />
		</NavSection>
		<NavSection label="Admin">
			<NavItem icon="settings" label="Settings" active={current === 'settings'} onclick={() => (current = 'settings')} />
		</NavSection>
	{/snippet}
	<Container size="none" pad>
		<Stack align="flex-start">
			<Text>Drawer open: <Text mono>{open}</Text></Text>
			<Button size="sm" onclick={() => (open = true)}>Open drawer (phones)</Button>
			<Text size="sm" tone="muted">Rail labels stay in the accessible name and show as tooltips.</Text>
		</Stack>
	</Container>
</AppShell>
