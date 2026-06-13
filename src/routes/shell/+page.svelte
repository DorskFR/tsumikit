<script lang="ts">
	import {
		AppShell,
		NavItem,
		Container,
		Heading,
		Text,
		Badge,
		Button,
		Icon,
		Link,
		ThemePicker,
		Card,
		Stack,
		Cluster,
		AutoGrid,
		type IconName
	} from '$lib';

	const nav: { id: string; label: string; icon: IconName }[] = [
		{ id: 'overview', label: 'Overview', icon: 'info' },
		{ id: 'activity', label: 'Activity', icon: 'live' },
		{ id: 'files', label: 'Files', icon: 'folder' },
		{ id: 'starred', label: 'Starred', icon: 'star' },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	];
	let active = $state('overview');
</script>

<AppShell resizableSidebar minSidebar={64} maxSidebar={320} sidebarWidthKey="uikit-shell-sidebar">
	{#snippet header()}
		<Heading level={1} size="md">AppShell</Heading>
		<Badge tone="info">demo</Badge>
		<div class="spacer"></div>
		<Link href="/" class="cq-hide">← Showcase</Link>
		<ThemePicker />
	{/snippet}

	{#snippet sidebar()}
		<nav class="nav">
			{#each nav as item (item.id)}
				<NavItem
					icon={item.icon}
					label={item.label}
					active={active === item.id}
					onclick={() => (active = item.id)}
				/>
			{/each}
		</nav>
	{/snippet}

	{#snippet footer()}
		<Text variant="caption" tone="faint">@dorsk/uikit · AppShell example</Text>
	{/snippet}

	<Container pad>
		<Stack>
			<Heading level={2}>{nav.find((n) => n.id === active)?.label}</Heading>
			<Text variant="body" tone="muted">
				Drag the sidebar's right edge: below ~8rem the nav collapses to an icon
				rail (a <code>sidebar</code> container query — no JS state). On a narrow
				screen the sidebar becomes an overlay drawer. The toolbar below reacts to
				the <em>main</em> container width (which shrinks as you widen the sidebar),
				not the viewport — widen the sidebar and the buttons drop their labels.
			</Text>

			<!-- Container-responsive toolbar: buttons degrade to icon-only when the
			     MAIN container is tight. The labels are wrapped in .cq-hide. -->
			<Cluster>
				<Button variant="primary"><Icon name="plus" /> <span class="cq-hide">New file</span></Button>
				<Button><Icon name="download" /> <span class="cq-hide">Export</span></Button>
				<Button><Icon name="edit" /> <span class="cq-hide">Rename</span></Button>
				<Button variant="danger"><Icon name="trash" /> <span class="cq-hide">Delete</span></Button>
			</Cluster>

			<AutoGrid>
				{#each Array(4) as _, i (i)}
					<Card>
						<Heading level={3} size="md">Card {i + 1}</Heading>
						<Text variant="body" tone="muted">Grid reflows by available width (intrinsic auto-fit).</Text>
					</Card>
				{/each}
			</AutoGrid>
		</Stack>
	</Container>
</AppShell>

<style>
	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
