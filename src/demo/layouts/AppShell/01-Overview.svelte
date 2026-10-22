<script module>
	export const meta = {
		title: 'Ops console',
		caption: 'resizableSidebar: drag the sidebar edge under 8rem and the nav becomes an icon rail. Under 48rem of viewport the sidebar is a drawer behind the hamburger.',
		layout: 'frame',
		height: '28rem'
	};
</script>

<script lang="ts">
	import {
		AppShell,
		AutoGrid,
		Avatar,
		Badge,
		Container,
		Heading,
		IconButton,
		Link,
		Metric,
		NavItem,
		NavSection,
		Stack,
		Text
	} from '@dorsk/tsumikit';
	import { services } from '../../fixtures';
	import { shellNav } from './data';

	let current = $state('services');
</script>

<AppShell resizableSidebar minSidebar={64} maxSidebar={300} style="min-height: 100%; --z-header: 1">
	{#snippet header()}
		<Heading level={2} size="md">Northwind Ops</Heading>
		<Badge tone="warn" size="xs">staging</Badge>
		<span style="flex: 1"></span>
		<IconButton icon="bell" label="Notifications" variant="ghost" />
		<Avatar name="Amara Okafor" hue={210} size="sm" />
	{/snippet}
	{#snippet sidebar()}
		<nav>
			{#each shellNav as group (group.label ?? 'top')}
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
	{/snippet}
	{#snippet footer()}
		<Text size="xs" tone="faint">Full-page version: <Link href="shell">AppShell demo</Link></Text>
	{/snippet}
	<Container size="none" pad>
		<Stack>
			<Heading level={3}>Services</Heading>
			<AutoGrid min="10rem" gap="var(--sp-3)">
				{#each services as s (s.id)}
					<Metric label={s.name} value={s.cpu} unit="% CPU" tone={s.status} size="sm" />
				{/each}
			</AutoGrid>
		</Stack>
	</Container>
</AppShell>
