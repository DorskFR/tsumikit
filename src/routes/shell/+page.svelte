<script lang="ts">
	import {
		AppShell,
		Container,
		Heading,
		Text,
		Badge,
		Icon,
		Link,
		ThemePicker,
		Card,
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

<AppShell>
	{#snippet header()}
		<Heading level={1} size="md">AppShell</Heading>
		<Badge tone="info">demo</Badge>
		<div class="spacer"></div>
		<Link href="/">← Showcase</Link>
		<ThemePicker />
	{/snippet}

	{#snippet sidebar()}
		<nav class="nav">
			{#each nav as item (item.id)}
				<button
					type="button"
					class="nav-item"
					class:active={active === item.id}
					aria-current={active === item.id ? 'page' : undefined}
					onclick={() => (active = item.id)}
				>
					<Icon name={item.icon} />
					<span>{item.label}</span>
				</button>
			{/each}
		</nav>
	{/snippet}

	{#snippet footer()}
		<Text variant="caption" tone="faint">@dorsk/uikit · AppShell example</Text>
	{/snippet}

	<Container pad>
		<div class="stack">
			<Heading level={2}>{nav.find((n) => n.id === active)?.label}</Heading>
			<Text variant="body" tone="muted">
				Resize the window: on desktop the sidebar is a persistent column; on a
				narrow screen it collapses to an overlay drawer with a hamburger in the
				header, a scrim, Escape-to-close and scroll lock.
			</Text>
			<div class="auto-grid" style="--col-min: 14rem">
				{#each Array(4) as _, i (i)}
					<Card>
						<Heading level={3} size="md">Card {i + 1}</Heading>
						<Text variant="body" tone="muted">Content scales with the available width.</Text>
					</Card>
				{/each}
			</div>
		</div>
	</Container>
</AppShell>

<style>
	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		text-align: left;
		padding: var(--sp-2) var(--sp-3);
		border: none;
		background: none;
		color: var(--text-muted);
		border-radius: var(--r-md);
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
	}
	.nav-item:hover {
		background: var(--bg-elevated-2);
		color: var(--text);
	}
	.nav-item.active {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}
</style>
