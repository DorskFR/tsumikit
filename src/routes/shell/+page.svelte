<script lang="ts">
	import {
		AppShell,
		NavItem,
		NavSection,
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
	import { base } from '$app/paths';

	type NavLink = {
		id: string;
		label: string;
		icon: IconName;
		badge?: string | number;
		badgeTone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info';
	};
	const navGroups: { label?: string; items: NavLink[] }[] = [
		{
			items: [
				{ id: 'overview', label: 'Overview', icon: 'info' },
				{ id: 'activity', label: 'Activity', icon: 'live', badge: 38 }
			]
		},
		{
			label: 'Library',
			items: [
				{ id: 'files', label: 'Files', icon: 'folder', badge: 12 },
				{ id: 'starred', label: 'Starred', icon: 'star', badge: 4, badgeTone: 'warn' }
			]
		},
		{
			label: 'System',
			items: [{ id: 'settings', label: 'Settings', icon: 'settings' }]
		}
	];
	let active = $state('overview');
	const allItems = navGroups.flatMap((g) => g.items);
</script>

<AppShell resizableSidebar minSidebar={64} maxSidebar={320} sidebarWidthKey="tsumikit-shell-sidebar">
	{#snippet header()}
		<Heading level={1} size="md">AppShell</Heading>
		<Badge tone="info">demo</Badge>
		<div class="spacer"></div>
		<Link href="{base}/" class="cq-hide">← Showcase</Link>
		<ThemePicker />
	{/snippet}

	{#snippet sidebar()}
		<nav class="nav">
			{#each navGroups as group (group.label ?? 'top')}
				<NavSection label={group.label}>
					{#each group.items as item (item.id)}
						<NavItem
							icon={item.icon}
							label={item.label}
							badge={item.badge}
							badgeTone={item.badgeTone}
							active={active === item.id}
							onclick={() => (active = item.id)}
						/>
					{/each}
				</NavSection>
			{/each}
		</nav>
	{/snippet}

	{#snippet footer()}
		<Text variant="caption" tone="faint">@dorsk/tsumikit · AppShell example</Text>
	{/snippet}

	<Container pad>
		<Stack>
			<Heading level={2}>{allItems.find((n) => n.id === active)?.label}</Heading>
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
