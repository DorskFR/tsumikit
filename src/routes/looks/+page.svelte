<script lang="ts">
	import {
		Accordion,
		AutoGrid,
		Avatar,
		Badge,
		Breadcrumb,
		Button,
		Callout,
		Card,
		ChatBubble,
		Checkbox,
		Cluster,
		Composer,
		ConfirmModal,
		DataTable,
		Dot,
		Field,
		Gauge,
		Heading,
		Icon,
		IconButton,
		Input,
		Kbd,
		Menu,
		Metric,
		Modal,
		Popover,
		Progress,
		RadioGroup,
		RichSelect,
		SectionHeader,
		SegmentedControl,
		Select,
		Skeleton,
		Slider,
		Spinner,
		SplitButton,
		Stack,
		Switch,
		Tabs,
		Text,
		Textarea,
		AUTO_THEME,
		LOOKS,
		LookPicker,
		type LookId,
		THEMES,
		ThemePicker,
		theme,
		toasts,
		type Column,
		type MenuItem,
		type TabItem,
		type Tone,
	} from '@dorsk/tsumikit';
	import { onMount } from 'svelte';
	import { people, services } from '../../demo/fixtures';

	const LOOK_IDS = LOOKS.map((l) => l.id);
	const LIGHT_IDS = THEMES.filter((t) => t.mode === 'light').map((t) => t.id);
	const QUERY_PREPAINT = `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement,l=q.get('look'),t=q.get('theme');if(l==='default')d.removeAttribute('data-look');else if(${JSON.stringify(LOOK_IDS)}.indexOf(l)>=0)d.setAttribute('data-look',l);if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)>=0){d.setAttribute('data-theme',t);d.setAttribute('data-mode',${JSON.stringify(LIGHT_IDS)}.indexOf(t)>=0?'light':'dark')}}catch(e){}})();`;

	const MODES = [
		{ value: 'dark', label: 'Dark' },
		{ value: 'light', label: 'Light' },
		{ value: AUTO_THEME, label: 'Auto' },
	];
	let ready = $state(false);

	onMount(() => {
		const q = new URLSearchParams(location.search);
		const look = q.get('look');
		const id = q.get('theme');
		if (look && LOOK_IDS.includes(look as LookId)) theme.setLook(look);
		if (id && theme.has(id)) theme.choose(id);
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		const url = new URL(location.href);
		url.searchParams.set('look', theme.look);
		if (theme.mode === AUTO_THEME) url.searchParams.delete('theme');
		else url.searchParams.set('theme', theme.current);
		history.replaceState(history.state, '', url);
	});

	const TONES: Tone[] = ['neutral', 'accent', 'ok', 'warn', 'danger', 'info'];
	const VARIANTS = ['default', 'primary', 'ghost', 'danger', 'link'] as const;
	const SIZES = ['sm', 'md', 'lg'] as const;

	let workspace = $state('Platform team');
	let region = $state('eu-west-1');
	let plan = $state<string | number | undefined>('pro');
	let notes = $state('Deploys freeze on Fridays after 16:00 UTC.');
	let audit = $state(true);
	let twoFactor = $state(false);
	let digest = $state(true);
	let retention = $state(30);
	let visibility = $state('team');
	let density = $state('comfortable');
	let tab = $state<string | undefined>('activity');
	let saving = $state(false);
	let modalOpen = $state(false);
	let confirmOpen = $state(false);
	let draft = $state('');

	const plans = [
		{ id: 'free', name: 'Free', blurb: '3 seats · community support', tone: 'neutral' as Tone },
		{ id: 'pro', name: 'Pro', blurb: '25 seats · 99.9% SLA', tone: 'accent' as Tone },
		{ id: 'scale', name: 'Scale', blurb: 'Unlimited · dedicated support', tone: 'info' as Tone },
	];

	const tabs: TabItem[] = [
		{ id: 'activity', label: 'Activity', icon: 'clock', count: 12 },
		{ id: 'alerts', label: 'Alerts', icon: 'bell', count: 2 },
		{ id: 'settings', label: 'Settings', icon: 'settings' },
	];

	const rowMenu: MenuItem[] = [
		{ label: 'Edit', icon: 'edit', onselect: () => toasts.show('Editing') },
		{ label: 'Duplicate', icon: 'copy', onselect: () => toasts.ok('Duplicated') },
		{ label: 'Manage access', icon: 'users', tag: 'admin', tagTone: 'info', onselect: () => toasts.show('Access') },
		{ label: 'Delete', icon: 'trash', danger: true, onselect: () => toasts.error('Deleted') },
	];

	const exportMenu: MenuItem[] = [
		{ label: 'Export CSV', icon: 'download', onselect: () => toasts.show('CSV export queued') },
		{ label: 'Export JSON', icon: 'download', onselect: () => toasts.show('JSON export queued') },
	];

	type Member = { id: string; name: string; role: string; hue: number; emoji?: string; status: 'ok' | 'warn' | 'danger'; seen: string };
	const members: Member[] = people.slice(0, 5).map((p, i) => ({
		id: p.handle,
		name: p.name,
		role: p.role,
		hue: p.hue,
		emoji: p.emoji,
		status: (['ok', 'ok', 'warn', 'ok', 'danger'] as const)[i],
		seen: ['now', '4 min', '1 h', '3 h', '9 d'][i],
	}));
	const STATUS_LABEL = { ok: 'active', warn: 'invited', danger: 'suspended' } as const;
	const memberCols: Column<Member>[] = [
		{ key: 'name', label: 'Member', sortable: true },
		{ key: 'role', label: 'Role' },
		{ key: 'status', label: 'Status' },
		{ key: 'seen', label: 'Last seen', align: 'right' },
	];

	async function save() {
		saving = true;
		await new Promise((r) => setTimeout(r, 900));
		saving = false;
		toasts.ok('Settings saved');
	}
</script>

<svelte:head>
	<title>tsumikit · looks</title>
	{@html `<script>${QUERY_PREPAINT}</` + `script>`}
</svelte:head>

{#snippet faqBilling()}
	<Text size="sm">Usage is metered per seat and invoiced on the first of each month.</Text>
{/snippet}
{#snippet faqCap()}
	<Text size="sm">Set a monthly cap per workspace. Builds pause when it is reached and resume at the next cycle.</Text>
{/snippet}
{#snippet faqExport()}
	<Text size="sm">Every table can be exported to CSV or JSON from its toolbar.</Text>
{/snippet}

{#snippet memberCell(m: Member)}
	<span class="who">
		<Avatar name={m.name} hue={m.hue} glyph={m.emoji} size="sm" decorative />
		<span class="who-text">
			<Text size="sm" weight="medium" truncate>{m.name}</Text>
			<Text size="xs" tone="muted" truncate>@{m.id}</Text>
		</span>
	</span>
{/snippet}
{#snippet statusCell(m: Member)}
	<Badge tone={m.status} dot size="sm">{STATUS_LABEL[m.status]}</Badge>
{/snippet}

<div class="looks">
	<header class="switcher" aria-label="Look switcher">
		<span class="switcher-group switcher-look">
			<Text size="xs" tone="muted" weight="semibold" uppercase>Look</Text>
			<span class="switcher-control">
				<LookPicker size="sm" scroll />
			</span>
		</span>
		<span class="switcher-group">
			<Text size="xs" tone="muted" weight="semibold" uppercase>Mode</Text>
			<SegmentedControl
				label="Mode"
				size="sm"
				options={MODES}
				value={theme.mode}
				onchange={(m) => theme.choose(m === 'light' ? theme.pref.light : m === 'dark' ? theme.pref.dark : AUTO_THEME)}
			/>
		</span>
		<span class="switcher-group">
			<Text size="xs" tone="muted" weight="semibold" uppercase>Theme</Text>
			<ThemePicker box="sm" auto placement="bottom-start" />
			<Text size="xs" tone="muted">{theme.label}</Text>
		</span>
	</header>

	<main class="page">
		<section class="page-head" data-section="header">
			<Breadcrumb items={[{ label: 'Acme', href: '#' }, { label: 'Workspaces', href: '#' }, { label: 'Platform team' }]} />
			<div class="head-row">
				<div class="head-text">
					<Heading level={1}>Platform team</Heading>
					<Text tone="muted">12 members · 48 services · billed monthly on the Pro plan</Text>
				</div>
				<Cluster gap="var(--sp-2)">
					<Menu label="Export" items={exportMenu} variant="ghost">
						{#snippet trigger()}<Icon name="download" size={16} /> Export{/snippet}
					</Menu>
					<Button>Invite people</Button>
					<Button variant="primary"><Icon name="plus" size={16} /> New service</Button>
				</Cluster>
			</div>
		</section>

		<section data-section="metrics">
			<AutoGrid min="200px">
				<Metric label="Requests" value="1.28" unit="M" sub="+4.2% vs yesterday" icon="zap" />
				<Metric label="Error rate" value="0.31" unit="%" sub="target < 0.5%" icon="alert-circle" tone="ok" />
				<Metric label="p95 latency" value={412} unit="ms" sub="+38 ms since deploy" icon="clock" tone="warn" tintValue />
				<Metric label="Spend today" value="$184" sub="cap $250 · resets in 6h" icon="flame" tone="danger" />
			</AutoGrid>
		</section>

		<div class="two">
			<section data-section="settings">
				<Card title="Workspace settings" subtitle="Applies to every member" gap="var(--sp-4)">
					<Field label="Workspace name" for="lk-name" hint="Shown in invites and the sidebar.">
						<Input id="lk-name" bind:value={workspace} />
					</Field>
					<div class="pair">
						<Field label="Default region" for="lk-region">
							<Select
								id="lk-region"
								bind:value={region}
								options={[
									{ value: 'eu-west-1', label: 'Ireland (eu-west-1)' },
									{ value: 'us-east-1', label: 'Virginia (us-east-1)' },
									{ value: 'ap-northeast-1', label: 'Tokyo (ap-northeast-1)' },
								]}
							/>
						</Field>
						<RichSelect
							label="Plan"
							options={plans}
							bind:value={plan}
							getKey={(p) => p.id}
							getLabel={(p) => p.name}
						>
							{#snippet option({ option })}
								<span class="plan">
									<span class="plan-text">
										<Text size="sm" weight="medium">{option.name}</Text>
										<Text size="xs" tone="muted" truncate>{option.blurb}</Text>
									</span>
									<Badge tone={option.tone} size="sm">{option.id}</Badge>
								</span>
							{/snippet}
						</RichSelect>
					</div>
					<Field label="Notes" for="lk-notes">
						<Textarea id="lk-notes" bind:value={notes} autoresize />
					</Field>
					<Field label="Workspace email" for="lk-mail" error="That address is already used by another workspace.">
						<Input id="lk-mail" value="ops@acme" invalid />
					</Field>
					<Stack gap="var(--sp-2)">
						<Checkbox label="Keep an audit log of every change" bind:checked={audit} />
						<Checkbox label="Require two-factor sign-in" bind:checked={twoFactor} />
						<Checkbox label="Mixed selection" indeterminate />
						<Switch label="Weekly digest" labelVisible bind:checked={digest} />
						<Switch label="Beta features" labelVisible disabled />
					</Stack>
					<Slider label="Log retention" bind:value={retention} min={7} max={90} step={1} showValue format={(v) => `${v} days`} />
					<RadioGroup
						label="Visibility"
						bind:value={visibility}
						options={[
							{ value: 'private', label: 'Private', description: 'Only invited members' },
							{ value: 'team', label: 'Team', description: 'Everyone in Acme' },
							{ value: 'public', label: 'Public', description: 'Anyone with the link', disabled: true },
						]}
					/>
					<Field label="Density">
						<SegmentedControl
							label="Density"
							bind:value={density}
							options={[
								{ value: 'compact', label: 'Compact' },
								{ value: 'comfortable', label: 'Comfortable' },
								{ value: 'spacious', label: 'Spacious' },
							]}
						/>
					</Field>
					{#snippet footer()}
						<Cluster justify="flex-end">
							<Button variant="ghost">Cancel</Button>
							<Button variant="primary" loading={saving} onclick={save}>Save changes</Button>
						</Cluster>
					{/snippet}
				</Card>
			</section>

			<section data-section="actions">
				<Card title="Actions" subtitle="Every variant and size" gap="var(--sp-4)">
					{#each SIZES as size (size)}
						<Cluster gap="var(--sp-2)">
							{#each VARIANTS as variant (variant)}
								<Button {variant} {size}>{variant}</Button>
							{/each}
						</Cluster>
					{/each}
					<Cluster gap="var(--sp-2)">
						<Button disabled>Disabled</Button>
						<Button variant="primary" disabled>Disabled</Button>
						<Button loading>Loading</Button>
						<Button variant="primary" loading>Saving</Button>
						<Button pill>Pill</Button>
						<Button shortcut="mod+k">Search</Button>
					</Cluster>
					<Cluster gap="var(--sp-2)">
						{#each TONES as tone (tone)}
							<Button {tone} size="sm">{tone}</Button>
						{/each}
					</Cluster>
					<Cluster gap="var(--sp-1)">
						<IconButton icon="edit" label="Edit" />
						<IconButton icon="copy" label="Copy" />
						<IconButton icon="star" label="Star" pressed filled />
						<IconButton icon="settings" label="Settings" box="md" />
						<IconButton icon="trash" label="Delete" hoverDanger />
						<Menu label="More actions" items={rowMenu} placement="bottom-end" box="sm">
							{#snippet trigger()}<Icon name="more" size={16} />{/snippet}
						</Menu>
					</Cluster>
					<Cluster gap="var(--sp-2)">
						<SplitButton variant="primary" label="More deploy options" items={exportMenu} onclick={() => toasts.show('Deploying')}>
							Deploy
						</SplitButton>
						<SplitButton label="More save options" items={exportMenu}>Save draft</SplitButton>
					</Cluster>
					<Cluster gap="var(--sp-2)">
						<Text size="sm" tone="muted">Command palette</Text>
						<Kbd keys={['mod', 'K']} />
						<Text size="sm" tone="muted">New</Text>
						<Kbd keys="N" />
						<Kbd keys={['shift', '?']} size="md" />
					</Cluster>
					<div class="menu-preview" aria-hidden="true">
						<Text size="xs" tone="muted" weight="semibold" uppercase>Menu (static preview)</Text>
						<Card surface="raised" padding="sm" class="fake-menu">
							{#each rowMenu as item (item.label)}
								<Button variant="ghost" size="sm" block tone={item.danger ? 'danger' : 'none'} tabindex={-1}>
									{#if item.icon}<Icon name={item.icon} size={16} />{/if}
									<span class="fake-menu-label">{item.label}</span>
									{#if item.tag}<Badge size="xs" tone={item.tagTone}>{item.tag}</Badge>{/if}
								</Button>
							{/each}
						</Card>
					</div>
				</Card>
			</section>
		</div>

		<section data-section="activity">
			<SectionHeader title="Activity" subtitle="Last 24 hours" divider>
				{#snippet actions()}
					<Popover label="Notification preferences" variant="default" placement="bottom-end">
						{#snippet trigger()}<Icon name="bell" size={16} /> Notify{/snippet}
						{#snippet children({ close })}
							<div class="pop">
								<Switch label="Mentions" labelVisible checked />
								<Switch label="Deploys" labelVisible />
								<Button size="sm" variant="primary" onclick={close}>Done</Button>
							</div>
						{/snippet}
					</Popover>
				{/snippet}
			</SectionHeader>
			<Tabs {tabs} bind:value={tab} label="Activity">
				{#snippet panel(id)}
					{#if id === 'activity'}
						<Stack gap="var(--sp-2)">
							{#each services.slice(0, 4) as s (s.id)}
								<div class="event">
									<Dot status={s.status === 'ok' ? 'active' : s.status === 'warn' ? 'stale' : 'dead'} glow={s.status === 'ok'} />
									<Text size="sm" mono truncate>{s.name}</Text>
									<Text size="sm" tone="muted" truncate>deployed {s.region}</Text>
									<Badge size="xs" tone={s.status}>{s.status}</Badge>
								</div>
							{/each}
						</Stack>
					{:else if id === 'alerts'}
						<Stack gap="var(--sp-2)">
							<Callout tone="warn" title="CPU above 80%">worker-02 has been hot for 15 minutes.</Callout>
							<Callout tone="danger" title="Disk almost full">db-primary is at 94%.</Callout>
						</Stack>
					{:else}
						<Text size="sm" tone="muted">Alert thresholds, on-call rota and escalation rules live here.</Text>
					{/if}
				{/snippet}
			</Tabs>
		</section>

		<section data-section="status">
			<SectionHeader title="Status" subtitle="Badges, dots and callouts in every tone" divider />
			<Stack gap="var(--sp-3)">
				<Cluster gap="var(--sp-2)">
					{#each TONES as tone (tone)}<Badge {tone}>{tone}</Badge>{/each}
				</Cluster>
				<Cluster gap="var(--sp-2)">
					{#each TONES as tone (tone)}<Badge {tone} dot size="sm" uppercase>{tone}</Badge>{/each}
				</Cluster>
				<Cluster gap="var(--sp-2)">
					{#each TONES as tone (tone)}<Badge {tone} variant="text">{tone}</Badge>{/each}
					<Badge mono removable onremove={() => toasts.show('Removed')}>region:eu-west-1</Badge>
					<Badge numeric tone="accent">128</Badge>
				</Cluster>
				<Cluster gap="var(--sp-4)">
					<Dot status="active" glow label="working" />
					<Dot status="stale" label="idle" />
					<Dot status="hibernated" label="hibernated" />
					<Dot status="dead" label="exited" />
				</Cluster>
				<div class="callouts">
					{#each TONES as tone (tone)}
						<Callout {tone} title="{tone[0].toUpperCase()}{tone.slice(1)} callout">
							A short message explaining what happened and what to do next.
						</Callout>
					{/each}
					<Callout tone="info" busy>Syncing 48 records…</Callout>
					<Callout tone="ok" title="Linked" dismissible>
						45 records matched.
						{#snippet actions()}<Button size="sm">Review</Button>{/snippet}
					</Callout>
				</div>
			</Stack>
		</section>

		<section data-section="members">
			<SectionHeader title="Members" count={members.length} divider>
				{#snippet actions()}<Button size="sm" variant="primary">Invite</Button>{/snippet}
			</SectionHeader>
			<DataTable
				columns={memberCols}
				rows={members}
				rowKey={(m) => m.id}
				responsive="stack"
				cellSnippets={{ name: memberCell, status: statusCell }}
				onrowclick={(m) => toasts.show(m.name)}
			>
				{#snippet rowActions(m: Member)}
					<Menu label="Actions for {m.name}" items={rowMenu} placement="bottom-end" box="sm">
						{#snippet trigger()}<Icon name="more" size={16} />{/snippet}
					</Menu>
				{/snippet}
			</DataTable>
		</section>

		<section data-section="cards">
			<SectionHeader title="Cards" subtitle="Plain, interactive, toned and surfaces" divider />
			<AutoGrid min="220px">
				<Card title="Plain card" subtitle="surface base">
					<Text size="sm" tone="muted">A default card with a title and body copy.</Text>
				</Card>
				<Card interactive onclick={() => toasts.show('Card clicked')}>
					<Stack gap="var(--sp-1)">
						<Text weight="semibold">Interactive card</Text>
						<Text size="sm" tone="muted">Hover and press me.</Text>
					</Stack>
				</Card>
				<Card surface="raised" title="Raised" subtitle="surface raised">
					<Text size="sm" tone="muted">Sits above the page.</Text>
				</Card>
				<Card surface="sunken" title="Sunken" subtitle="surface sunken">
					<Text size="sm" tone="muted">Recessed well.</Text>
				</Card>
				{#each ['accent', 'ok', 'warn', 'danger', 'info'] as const as tone (tone)}
					<Card {tone} title="{tone} card" subtitle="tone={tone}">
						<Text size="sm" tone="muted">Toned surface.</Text>
					</Card>
				{/each}
				<Card border="dashed">
					<Stack gap="var(--sp-2)" align="center">
						<Icon name="upload" size={20} />
						<Text size="sm" tone="muted">Dashed drop target</Text>
					</Stack>
				</Card>
				<Card stacked title="Stacked" subtitle="3 more">
					<Text size="sm" tone="muted">A pile of cards.</Text>
				</Card>
			</AutoGrid>
		</section>

		<section data-section="progress">
			<SectionHeader title="Progress & loading" divider />
			<div class="two">
				<Stack gap="var(--sp-3)">
					<Progress value={72} label="Storage" showValue />
					<Progress value={45} tone="ok" label="Healthy" />
					<Progress value={82} tone="warn" striped label="Warn" />
					<Progress value={96} tone="danger" gradient label="Danger" />
					<Progress indeterminate label="Working" />
					<Cluster gap="var(--sp-4)">
						<span class="gauge"><Text size="xs" tone="muted">cpu</Text><Gauge value={34} label="CPU 34%" /></span>
						<span class="gauge"><Text size="xs" tone="muted">mem</Text><Gauge value={76} label="Memory 76%" /></span>
						<span class="gauge"><Text size="xs" tone="muted">disk</Text><Gauge value={94} variant="segments" segments={4} label="Disk 94%" /></span>
					</Cluster>
				</Stack>
				<Stack gap="var(--sp-3)">
					<Cluster gap="var(--sp-4)">
						{#each ['icon', 'arc', 'dots', 'orbit', 'pulse', 'bars'] as const as variant (variant)}
							<Spinner {variant} size={20} />
						{/each}
					</Cluster>
					<Card>
						<Stack gap="var(--sp-3)">
							<Cluster gap="var(--sp-3)">
								<Skeleton circle height="40px" />
								<Stack gap="var(--sp-1)" grow>
									<Skeleton width="9rem" />
									<Skeleton width="5rem" height="0.75em" />
								</Stack>
							</Cluster>
							<Skeleton lines={3} height="0.85em" />
						</Stack>
					</Card>
				</Stack>
			</div>
		</section>

		<div class="two">
			<section data-section="faq">
				<SectionHeader title="FAQ" divider />
				<Accordion
					multiple={false}
					items={[
						{ id: 'billing', title: 'When am I billed?', content: faqBilling, open: true },
						{ id: 'cap', title: 'How do I set a spending cap?', content: faqCap },
						{ id: 'export', title: 'Can I export my data?', content: faqExport },
					]}
				/>
			</section>

			<section data-section="chat">
				<SectionHeader title="Assistant" divider />
				<Stack gap="var(--sp-3)">
					<ChatBubble role="user" timestamp={Date.now() - 120_000} markdown="Why did **worker-02** restart twice?" />
					<ChatBubble
						role="assistant"
						timestamp={Date.now() - 60_000}
						markdown={'It hit the memory limit (`1.9 GB`) during the nightly transcode. Raising the limit or splitting the batch fixes it.'}
					/>
					<Composer bind:value={draft} placeholder="Ask about your services…" onsubmit={() => toasts.show('Sent')} />
				</Stack>
			</section>
		</div>

		<section data-section="overlays">
			<SectionHeader title="Overlays" subtitle="Toasts and dialogs" divider />
			<Cluster gap="var(--sp-2)">
				<Button onclick={() => toasts.show('Workspace renamed')}>Toast</Button>
				<Button onclick={() => toasts.ok('Deploy succeeded')}>Success toast</Button>
				<Button onclick={() => toasts.error('Deploy failed')}>Error toast</Button>
				<Button onclick={() => toasts.info('New version available')}>Info toast</Button>
				<Button variant="primary" onclick={() => (modalOpen = true)}>Open modal</Button>
				<Button variant="danger" onclick={() => (confirmOpen = true)}>Delete workspace</Button>
			</Cluster>
		</section>
	</main>
</div>

<Modal bind:open={modalOpen} title="Invite people">
	{#snippet body()}
		<Stack gap="var(--sp-3)">
			<Field label="Email" for="lk-invite"><Input id="lk-invite" placeholder="name@acme.com" /></Field>
			<Field label="Role" for="lk-invite-role">
				<Select id="lk-invite-role" options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }]} />
			</Field>
		</Stack>
	{/snippet}
	{#snippet footer()}
		<Button onclick={() => (modalOpen = false)}>Cancel</Button>
		<Button variant="primary" onclick={() => (modalOpen = false)}>Send invite</Button>
	{/snippet}
</Modal>

<ConfirmModal
	bind:open={confirmOpen}
	title="Delete workspace?"
	message="All 48 services and their logs are removed. This cannot be undone."
	confirmLabel="Delete"
	tone="danger"
	onconfirm={() => {
		toasts.error('Workspace deleted');
	}}
/>

<style>
	.looks {
		min-height: 100dvh;
		background: var(--bg);
		color: var(--text);
	}
	.switcher {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-2) var(--sp-6);
		padding: var(--sp-2) var(--sp-4);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.switcher-group {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		max-width: 100%;
	}
	.switcher-look {
		flex: 0 1 34rem;
	}
	.switcher-control {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.page {
		display: grid;
		gap: var(--sp-8);
		max-width: 76rem;
		margin: 0 auto;
		padding: var(--sp-6) var(--sp-4) var(--sp-12);
	}
	section {
		display: grid;
		gap: var(--sp-3);
		min-width: 0;
	}
	.page-head {
		gap: var(--sp-2);
	}
	.head-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--sp-4);
	}
	.head-text {
		display: grid;
		gap: var(--sp-1);
		min-width: 0;
	}
	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--sp-6);
		align-items: start;
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--sp-3);
	}
	.plan {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
		min-width: 0;
		width: 100%;
	}
	.plan-text,
	.who-text {
		display: grid;
		min-width: 0;
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
	.event {
		display: grid;
		grid-template-columns: auto minmax(0, 10rem) minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--sp-2);
	}
	.callouts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
		gap: var(--sp-2);
	}
	.menu-preview {
		display: grid;
		gap: var(--sp-1);
		max-width: 16rem;
	}
	.menu-preview :global(.fake-menu) {
		box-shadow: var(--shadow-md);
	}
	.fake-menu-label {
		flex: 1 1 auto;
		text-align: start;
	}
	.pop {
		display: grid;
		gap: var(--sp-2);
		min-width: 12rem;
		padding: var(--sp-3);
	}
	.gauge {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	@media (max-width: 52rem) {
		.two,
		.pair {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 30rem) {
		.page {
			gap: var(--sp-6);
			padding-inline: var(--sp-3);
		}
		.switcher {
			padding-inline: var(--sp-3);
		}
		.event {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}
		.event > :global(:nth-child(3)) {
			display: none;
		}
	}
</style>
