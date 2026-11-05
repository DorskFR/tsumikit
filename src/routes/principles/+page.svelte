<script lang="ts">
	import {
		AppShell,
		Badge,
		Button,
		Callout,
		Card,
		Cluster,
		Dot,
		EmptyState,
		Heading,
		Link,
		NavItem,
		Prose,
		Stack,
		Tabs,
		Text,
		ThemePicker,
		toasts,
		urlState,
	} from '@dorsk/tsumikit';
	import { base } from '$app/paths';
	import DoDont from './DoDont.svelte';
	import { anchorOf, overviewHtml, principles } from './principles';

	let navOpen = $state(false);

	let saving = $state(false);
	let flashing = $state(false);
	const fakeRequest = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
	async function save(set: (busy: boolean) => void) {
		set(true);
		await fakeRequest(150);
		set(false);
	}

	let archived = $state<string[]>([]);
	const letters = ['Invoice March', 'Offer letter', 'Travel receipts'];
	const inbox = $derived(letters.filter((l) => !archived.includes(l)));
	function archive(name: string) {
		toasts.undo({
			message: `Archived "${name}"`,
			apply: () => {
				archived = [...archived, name];
			},
			commit: () => fakeRequest(100),
			revert: () => {
				archived = archived.filter((n) => n !== name);
			},
		});
	}

	const view = urlState('view', { default: 'all' });
	const viewTabs = [
		{ id: 'all', label: 'All' },
		{ id: 'open', label: 'Open' },
		{ id: 'done', label: 'Done' },
	];
	let localTab = $state('all');
</script>

<svelte:head>
	<title>Design principles · @dorsk/tsumikit</title>
</svelte:head>

<AppShell bind:open={navOpen} stickySidebar navLabel="Principles">
	{#snippet header()}
		<Heading level={1} size="md">
			<Link href="{base}/" tone="inherit" underline="none">@dorsk/tsumikit</Link>
			<Text as="span" tone="muted" weight="normal">/ principles</Text>
		</Heading>
		<div class="header-end">
			<ThemePicker box="sm" auto autoLabel="Auto" placement="bottom-end" />
		</div>
	{/snippet}

	{#snippet sidebar()}
		<NavItem href="#overview" label="Overview" icon="book" />
		{#each principles as p (p.id)}
			<NavItem href="#{anchorOf(p.id)}" label="{p.id} {p.title}" />
		{/each}
	{/snippet}

	<div class="page">
		<section id="overview" class="section">
			<Heading level={2} size="lg">Design principles</Heading>
			<Prose html={overviewHtml} />
		</section>

		{#each principles as p (p.id)}
			<section id={anchorOf(p.id)} class="section" data-principle={p.id}>
				<Stack gap="var(--sp-2)">
					<Cluster gap="var(--sp-2)" align="center">
						<Badge mono size="sm">{p.id}</Badge>
						<Heading level={2} size="md">{p.title}</Heading>
					</Cluster>
					<Text size="md" tone="muted" measure>{p.lead}</Text>
				</Stack>
				{#if p.id === '01'}
					<DoDont
						goodNote="The spinner waits 200 ms and stays 500 ms; a 150 ms save never shows one."
						badNote="Nothing acknowledges the click, so people click again."
					>
						{#snippet good()}
							<Cluster gap="var(--sp-2)" align="center">
								<Button variant="primary" loading={saving} onclick={() => save((b) => (saving = b))}>Save</Button>
								<Dot status="active" label="Synced" />
							</Cluster>
						{/snippet}
						{#snippet bad()}
							<Cluster gap="var(--sp-2)" align="center">
								<Button variant="primary" onclick={() => fakeRequest(150)}>Save</Button>
							</Cluster>
						{/snippet}
					</DoDont>
				{:else if p.id === '02'}
					<DoDont
						goodNote="One filled button; Cancel is quiet. Lint rule one-primary checks this."
						badNote="Two filled buttons compete; neither reads as the main thing to do."
					>
						{#snippet good()}
							<Cluster gap="var(--sp-2)">
								<Button variant="primary">Publish</Button>
								<Button>Save draft</Button>
								<Button variant="ghost">Cancel</Button>
							</Cluster>
						{/snippet}
						{#snippet bad()}
							<Cluster gap="var(--sp-2)">
								<Button variant="primary">Publish</Button>
								<!-- tsumikit-lint-ignore one-primary -->
								<Button variant="primary">Save draft</Button>
								<!-- tsumikit-lint-ignore one-primary -->
								<Button variant="primary">Cancel</Button>
							</Cluster>
						{/snippet}
					</DoDont>
				{:else if p.id === '03'}
					<DoDont
						goodNote="Three text levels: default, muted, faint. The title stands out because the rest is quiet."
						badNote="Everything is loud, so nothing is."
					>
						{#snippet good()}
							<Stack gap="var(--sp-1)">
								<Heading level={3} size="sm">Quarterly report</Heading>
								<Text tone="muted">Shared with 4 people</Text>
								<Text variant="caption" tone="faint">Edited yesterday</Text>
							</Stack>
						{/snippet}
						{#snippet bad()}
							<Stack gap="var(--sp-1)">
								<Heading level={3} size="sm">Quarterly report</Heading>
								<Heading level={4} size="sm">Shared with 4 people</Heading>
								<Heading level={4} size="sm">Edited yesterday</Heading>
							</Stack>
						{/snippet}
					</DoDont>
				{:else if p.id === '04'}
					<DoDont
						goodNote="The value explains itself; the one label left is small and muted."
						badNote="Labels repeat what the values already say."
					>
						{#snippet good()}
							<Stack gap="var(--sp-0-5)">
								<Text weight="medium">Jane Doe</Text>
								<Text tone="muted">jane@example.com</Text>
								<Text variant="caption" tone="faint">Member since May 2024</Text>
							</Stack>
						{/snippet}
						{#snippet bad()}
							<Stack gap="var(--sp-0-5)">
								<Text>Name: Jane Doe</Text>
								<Text>Email: jane@example.com</Text>
								<Text>Member since: May 2024</Text>
							</Stack>
						{/snippet}
					</DoDont>
				{:else if p.id === '06'}
					<DoDont
						goodNote="Surfaces differ by shade (surface raised, border none)."
						badNote="Nested boxes drawn with outlines."
					>
						{#snippet good()}
							<Card surface="raised" border="none" padding="sm">
								<Text weight="medium">Storage</Text>
								<Text tone="muted">42 GB of 100 GB used</Text>
							</Card>
						{/snippet}
						{#snippet bad()}
							<Card border="solid" padding="sm">
								<Card border="solid" padding="sm">
									<Text weight="medium">Storage</Text>
									<Text tone="muted">42 GB of 100 GB used</Text>
								</Card>
							</Card>
						{/snippet}
					</DoDont>
				{:else if p.id === '09'}
					<DoDont
						goodNote="Within a group --sp-1, between groups --sp-5: the gap does the grouping."
						badNote="Every line in its own box; the eye reads borders instead of content."
					>
						{#snippet good()}
							<Stack gap="var(--sp-5)">
								<Stack gap="var(--sp-1)">
									<Text variant="label" tone="muted">Billing</Text>
									<Text>Visa ending 4242</Text>
									<Text>Next charge 1 June</Text>
								</Stack>
								<Stack gap="var(--sp-1)">
									<Text variant="label" tone="muted">Team</Text>
									<Text>4 members</Text>
								</Stack>
							</Stack>
						{/snippet}
						{#snippet bad()}
							<Stack gap="var(--sp-2)">
								<Card border="solid" padding="sm"><Text>Visa ending 4242</Text></Card>
								<Card border="solid" padding="sm"><Text>Next charge 1 June</Text></Card>
								<Card border="solid" padding="sm"><Text>4 members</Text></Card>
							</Stack>
						{/snippet}
					</DoDont>
				{:else if p.id === '11'}
					<DoDont
						goodNote="Mono marks the code-like value only. Lint rule no-raw-font checks font-family use."
						badNote="A sentence set in monospace reads slowly and looks like a terminal."
					>
						{#snippet good()}
							<Stack gap="var(--sp-1)">
								<Text>Deployed from commit <Text as="span" mono>a11af43</Text></Text>
								<Text tone="muted">Build finished in 42 s</Text>
							</Stack>
						{/snippet}
						{#snippet bad()}
							<Stack gap="var(--sp-1)">
								<Text mono>Deployed from commit a11af43</Text>
								<Text mono tone="muted">Build finished in 42 s</Text>
							</Stack>
						{/snippet}
					</DoDont>
				{:else if p.id === '14'}
					<DoDont
						goodNote="Default loadingDelay 200 ms and loadingMin 500 ms: a quick save stays calm."
						badNote="loadingDelay=0 and loadingMin=0 flash a spinner for a few frames."
					>
						{#snippet good()}
							<Button variant="primary" loading={saving} onclick={() => save((b) => (saving = b))}>
								Save (150 ms)
							</Button>
						{/snippet}
						{#snippet bad()}
							<Button
								variant="primary"
								loading={flashing}
								loadingDelay={0}
								loadingMin={0}
								onclick={() => save((b) => (flashing = b))}
							>
								Save (150 ms)
							</Button>
						{/snippet}
					</DoDont>
				{:else if p.id === '15'}
					<DoDont
						goodNote="toasts.undo() applies at once and commits when the toast leaves; Undo reverts."
						badNote="A confirmation for a reversible action interrupts and gets clicked through."
					>
						{#snippet good()}
							<Stack gap="var(--sp-1)">
								{#each inbox as name (name)}
									<Cluster gap="var(--sp-2)" align="center" justify="space-between">
										<Text>{name}</Text>
										<Button size="sm" variant="ghost" onclick={() => archive(name)}>Archive</Button>
									</Cluster>
								{:else}
									<Text tone="muted">Inbox empty. Undo from the toast to bring one back.</Text>
								{/each}
							</Stack>
						{/snippet}
						{#snippet bad()}
							<Callout tone="warn" title="Archive this message?">
								You can find it later in the archive.
								{#snippet actions()}
									<Button size="sm" variant="primary">Archive</Button>
									<Button size="sm">Cancel</Button>
								{/snippet}
							</Callout>
						{/snippet}
					</DoDont>
				{:else if p.id === '16'}
					<DoDont
						goodNote="EmptyState says what belongs here and offers the action that fills it."
						badNote="A bare line leaves people wondering whether something broke."
					>
						{#snippet good()}
							<EmptyState
								size="compact"
								icon="folder"
								title="No projects yet"
								description="Projects group your tasks and files. Create the first one to get started."
								actionLabel="New project"
								onAction={() => toasts.info('This is where a project would be created.')}
							/>
						{/snippet}
						{#snippet bad()}
							<Text tone="muted">No data.</Text>
						{/snippet}
					</DoDont>
				{:else if p.id === '17'}
					<DoDont
						goodNote="What happened, why it matters, what to do next; tone danger and a retry action."
						badNote="A status code is for the log, not the person."
					>
						{#snippet good()}
							<EmptyState
								size="compact"
								tone="danger"
								icon="alert-circle"
								title="We couldn't load your projects"
								description="The connection dropped before the list arrived. Your work is safe."
								actionLabel="Try again"
								onAction={() => toasts.info('Retrying…')}
							/>
						{/snippet}
						{#snippet bad()}
							<Callout tone="danger">Error 500: Internal Server Error</Callout>
						{/snippet}
					</DoDont>
				{:else if p.id === '23'}
					<DoDont
						goodNote="Tabs with href from urlState('view'): refresh, Back and middle-click all work. Watch the address bar."
						badNote="Component state only; a refresh forgets the selection."
					>
						{#snippet good()}
							<Tabs tabs={viewTabs} bind:value={view.value} href={(id) => view.href(id)} label="Filter (URL)" />
						{/snippet}
						{#snippet bad()}
							<Tabs tabs={viewTabs} bind:value={localTab} label="Filter (local)" />
						{/snippet}
					</DoDont>
				{:else if p.id === '24'}
					<DoDont
						goodNote="A navigation is an anchor: hover shows the URL, middle-click opens a tab."
						badNote="A button that navigates in onclick breaks middle-click and the status bar."
					>
						{#snippet good()}
							<Link href="{base}/shell">Open the AppShell example</Link>
						{/snippet}
						{#snippet bad()}
							<Button variant="ghost" onclick={() => toasts.info('Would navigate with window.location')}>
								Open the AppShell example
							</Button>
						{/snippet}
					</DoDont>
				{:else if p.id === '29'}
					<DoDont
						goodNote="Colour plus a word: the state survives greyscale and colour blindness."
						badNote="A coloured disc alone carries the whole meaning."
					>
						{#snippet good()}
							<Cluster gap="var(--sp-3)">
								<Badge tone="ok" dot>Paid</Badge>
								<Badge tone="warn" dot>Pending</Badge>
								<Badge tone="danger" dot>Overdue</Badge>
							</Cluster>
						{/snippet}
						{#snippet bad()}
							<Cluster gap="var(--sp-3)">
								<Dot status="active" />
								<Dot status="stale" />
								<Dot status="dead" />
							</Cluster>
						{/snippet}
					</DoDont>
				{/if}
				<Prose html={p.html} />
			</section>
		{/each}
	</div>
</AppShell>

<style>
	.header-end {
		margin-inline-start: auto;
	}
	.page {
		display: grid;
		gap: var(--sp-8);
		max-inline-size: 56rem;
		padding-block: var(--sp-4) var(--sp-10);
	}
	.section {
		display: grid;
		gap: var(--sp-4);
		scroll-margin-block-start: var(--sp-12);
	}
</style>
