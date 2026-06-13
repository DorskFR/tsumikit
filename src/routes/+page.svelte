<script lang="ts">
	import {
		Text,
		Heading,
		Button,
		Input,
		Textarea,
		Select,
		Switch,
		Checkbox,
		Slider,
		Card,
		Badge,
		Chip,
		Link,
		Icon,
		Field,
		IconButton,
		SelectButton,
		Toggle,
		OptionButton,
		Modal,
		Popover,
		Menu,
		Tabs,
		RadioGroup,
		DataTable,
		toasts,
		ThemePicker,
		FontScalePicker,
		theme,
		type IconName,
		type MenuItem,
		type TabItem,
		type RadioOption,
		type Column
	} from '$lib';

	// interactive demo state
	let switchOn = $state(true);
	let toggleA = $state(true);
	let toggleB = $state(false);
	let toggleC = $state(false);
	let selectedOpt = $state('balanced');
	let textValue = $state('Editable text');
	let areaValue = $state('Multi-line input.\nGrows if autoresize is on.');
	let selectValue = $state('two');
	let pickerValue = $state('a');
	let modalOpen = $state(false);
	let check1 = $state(true);
	let check2 = $state(false);
	let radioValue = $state('email');
	let tabValue = $state<string | undefined>('overview');
	let sliderValue = $state(40);

	const menuItems: MenuItem[] = [
		{ label: 'Edit', icon: 'edit', onselect: () => toasts.show('Edit') },
		{ label: 'Duplicate', icon: 'copy', onselect: () => toasts.show('Duplicated') },
		{ label: 'Share', icon: 'external', onselect: () => toasts.ok('Shared') },
		{ label: 'Delete', icon: 'trash', danger: true, onselect: () => toasts.error('Deleted') }
	];
	const tabs: TabItem[] = [
		{ id: 'overview', label: 'Overview', icon: 'info' },
		{ id: 'activity', label: 'Activity', icon: 'live' },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	];
	const radioOptions: RadioOption[] = [
		{ value: 'email', label: 'Email', hint: 'Daily digest' },
		{ value: 'sms', label: 'SMS', hint: 'Urgent only' },
		{ value: 'none', label: 'None', hint: 'No notifications', disabled: true }
	];

	type Row = { id: number; name: string; role: string; status: 'ok' | 'warn' | 'danger' };
	const tableRows: Row[] = [
		{ id: 1, name: 'api-gateway', role: 'service', status: 'ok' },
		{ id: 2, name: 'worker-02', role: 'worker', status: 'warn' },
		{ id: 3, name: 'cache-01', role: 'cache', status: 'danger' }
	];
	const tableCols: Column<Row>[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'role', label: 'Role' },
		{ key: 'status', label: 'Status', align: 'right' }
	];

	const allIcons: IconName[] = [
		'search', 'back', 'check', 'x', 'plus', 'chevron-down', 'menu', 'archive',
		'trash', 'download', 'copy', 'edit', 'folder', 'link', 'external', 'markdown',
		'image', 'fork', 'more', 'settings', 'retry', 'stop', 'star', 'live', 'send',
		'filter', 'info', 'warning'
	];

	const tokens = [
		'--bg', '--bg-elevated', '--bg-elevated-2', '--surface', '--border',
		'--border-strong', '--text', '--text-muted', '--text-faint', '--accent',
		'--link', '--ok', '--warn', '--danger', '--info'
	];

	const effortOptions = [
		{ id: 'fast', label: 'Fast', hint: 'Lower latency' },
		{ id: 'balanced', label: 'Balanced', hint: 'Default' },
		{ id: 'thorough', label: 'Thorough', hint: 'Best quality' }
	];
</script>

<svelte:head>
	<title>@dorsk/uikit — component showcase</title>
</svelte:head>

<header class="top">
	<div class="container top-row">
		<Heading level={1} size="lg">@dorsk/uikit</Heading>
		<Text variant="caption" class="hide-sm">Svelte 5 · pure CSS · zero deps</Text>
		<div class="spacer"></div>
		<FontScalePicker />
		<ThemePicker />
	</div>
</header>

<main class="container page">
	<Text variant="body" tone="muted">
		One token contract, themeable atoms &amp; molecules. Current theme:
		<Text weight="semibold" tone="accent">{theme.label}</Text>. Try the pickers
		top-right — every section below re-themes live and scales with the text control.
	</Text>

	<!-- TYPOGRAPHY -->
	<section class="section">
		<Heading level={2}>Typography</Heading>
		<Card>
			<div class="stack">
				<Heading level={1}>Heading level 1</Heading>
				<Heading level={2}>Heading level 2</Heading>
				<Heading level={3}>Heading level 3</Heading>
				<Heading level={4}>Heading level 4</Heading>
				<hr class="divider" />
				<Text variant="body">Body — the default reading text.</Text>
				<Text variant="label">Label — form labels &amp; field captions.</Text>
				<Text variant="caption">Caption — small meta text.</Text>
				<Text variant="code">Code — monospace inline.</Text>
				<div class="row row-wrap">
					<Text tone="default">default</Text>
					<Text tone="muted">muted</Text>
					<Text tone="faint">faint</Text>
					<Text tone="accent">accent</Text>
					<Text tone="danger">danger</Text>
				</div>
				<div class="row row-wrap">
					<Text weight="normal">normal</Text>
					<Text weight="medium">medium</Text>
					<Text weight="semibold">semibold</Text>
					<Text weight="bold">bold</Text>
				</div>
			</div>
		</Card>
	</section>

	<!-- BUTTONS -->
	<section class="section">
		<Heading level={2}>Button</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<Button>Default</Button>
					<Button variant="primary">Primary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="danger">Danger</Button>
					<Button disabled>Disabled</Button>
				</div>
				<div class="row row-wrap">
					<Button size="sm">Small</Button>
					<Button size="md">Medium</Button>
					<Button control>Control height</Button>
					<Button control variant="primary">Control primary</Button>
				</div>
				<Button block variant="primary">Block button</Button>
			</div>
		</Card>
	</section>

	<!-- ICON BUTTONS + ICONS -->
	<section class="section">
		<Heading level={2}>Icon &amp; IconButton</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<IconButton icon="search" label="Search" />
					<IconButton icon="edit" label="Edit" variant="default" />
					<IconButton icon="star" label="Star" variant="primary" />
					<IconButton icon="trash" label="Delete" variant="danger" />
					<IconButton icon="x" label="Remove" inline />
					<IconButton icon="trash" label="Remove" inline class="hover-danger" />
				</div>
				<hr class="divider" />
				<Text variant="caption">All registry glyphs (sized at 1em — they scale with text):</Text>
				<div class="icon-grid">
					{#each allIcons as name (name)}
						<div class="icon-cell" title={name}>
							<Icon {name} size={22} />
							<Text variant="caption" tone="faint">{name}</Text>
						</div>
					{/each}
				</div>
				<Text variant="caption">Custom (open) icon via children snippet:</Text>
				<div class="row">
					<Icon label="Heart" size={22}>
						<path d="M12 21s-7-4.5-9.5-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6.5C19 16.5 12 21 12 21z" />
					</Icon>
				</div>
			</div>
		</Card>
	</section>

	<!-- BADGES / CHIPS / LINKS / DOTS -->
	<section class="section">
		<Heading level={2}>Badge · Chip · Link · Dot</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<Badge>neutral</Badge>
					<Badge tone="ok">ok</Badge>
					<Badge tone="warn">warn</Badge>
					<Badge tone="danger">danger</Badge>
					<Badge tone="info">info</Badge>
				</div>
				<div class="row row-wrap">
					<Chip>chip</Chip>
					<Chip mono>~/path/to/file</Chip>
					<Chip as="button">interactive chip</Chip>
				</div>
				<div class="row row-wrap">
					<Link href="https://svelte.dev" target="_blank" rel="noreferrer">Anchor link</Link>
					<Link>Button-as-link</Link>
				</div>
				<div class="row row-wrap">
					<span class="dot dot-active"></span> <Text variant="caption">active</Text>
					<span class="dot dot-stale"></span> <Text variant="caption">stale</Text>
					<span class="dot dot-dead"></span> <Text variant="caption">dead</Text>
					<span class="dot dot-hibernated"></span> <Text variant="caption">hibernated</Text>
				</div>
			</div>
		</Card>
	</section>

	<!-- FORM ATOMS -->
	<section class="section">
		<Heading level={2}>Form atoms &amp; Field</Heading>
		<Card>
			<div class="form-grid">
				<Field label="Text input" for="f-input" hint="Helper text below the control.">
					<Input id="f-input" bind:value={textValue} placeholder="Type here" />
				</Field>
				<Field label="With error" for="f-err" error="This field is required.">
					<Input id="f-err" placeholder="Invalid" aria-invalid="true" />
				</Field>
				<Field label="Monospace input" for="f-mono">
					<Input id="f-mono" mono value="export TOKEN=…" />
				</Field>
				<Field label="Select" for="f-select">
					<Select id="f-select" bind:value={selectValue}>
						<option value="one">Option one</option>
						<option value="two">Option two</option>
						<option value="three">Option three</option>
					</Select>
				</Field>
				<Field label="Textarea (autoresize)" for="f-area" class="span-2">
					<Textarea id="f-area" autoresize bind:value={areaValue} />
				</Field>
				<Field label="Switch" class="span-2">
					<div class="row">
						<Switch checked={switchOn} label="Toggle setting" onclick={() => (switchOn = !switchOn)} />
						<Text variant="caption">{switchOn ? 'On' : 'Off'}</Text>
					</div>
				</Field>
				<Field label="Slider" for="f-slider" class="span-2">
					<Slider id="f-slider" bind:value={sliderValue} label="Volume" showValue format={(v) => `${v}%`} />
				</Field>
			</div>
		</Card>
	</section>

	<!-- TOGGLES + OPTION BUTTONS + SELECT BUTTON -->
	<section class="section">
		<Heading level={2}>Toggle · OptionButton · SelectButton</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<Toggle pressed={toggleA} onclick={() => (toggleA = !toggleA)}>Filter A</Toggle>
					<Toggle pressed={toggleB} onclick={() => (toggleB = !toggleB)}>Filter B</Toggle>
					<Toggle pill pressed={toggleC} onclick={() => (toggleC = !toggleC)}>Pill</Toggle>
					<Toggle struck pressed onclick={() => {}}>Struck</Toggle>
				</div>
				<hr class="divider" />
				<div class="opt-grid">
					{#each effortOptions as o (o.id)}
						<OptionButton selected={selectedOpt === o.id} onclick={() => (selectedOpt = o.id)}>
							<Text weight="semibold">{o.label}</Text>
							<Text variant="caption" class="faint">{o.hint}</Text>
						</OptionButton>
					{/each}
				</div>
				<hr class="divider" />
				<div class="row">
					<Text variant="caption">SelectButton (native select over a glyph button):</Text>
					<SelectButton
						glyph="⚙"
						label="Pick a value"
						value={pickerValue}
						options={[
							{ value: 'a', label: 'Alpha' },
							{ value: 'b', label: 'Beta' },
							{ value: 'c', label: 'Gamma' }
						]}
						onchange={(v) => (pickerValue = v)}
					/>
					<Text variant="caption" tone="muted">selected: {pickerValue}</Text>
				</div>
			</div>
		</Card>
	</section>

	<!-- CHECKBOX / RADIO -->
	<section class="section">
		<Heading level={2}>Checkbox &amp; RadioGroup</Heading>
		<Card>
			<div class="form-grid">
				<Field label="Checkboxes">
					<div class="stack">
						<Checkbox bind:checked={check1} label="Enabled" />
						<Checkbox bind:checked={check2} label="Beta features" />
						<Checkbox indeterminate label="Partially selected" />
						<Checkbox disabled label="Disabled" />
					</div>
				</Field>
				<Field label="Radio group">
					<RadioGroup label="Notifications" options={radioOptions} bind:value={radioValue} />
				</Field>
			</div>
		</Card>
	</section>

	<!-- POPOVER / MENU -->
	<section class="section">
		<Heading level={2}>Popover &amp; Menu <Badge tone="info">native top layer</Badge></Heading>
		<Card>
			<div class="row row-wrap">
				<Popover label="Info popover">
					{#snippet trigger()}<Icon name="info" size={18} />{/snippet}
					<div style="padding: var(--sp-2)">
						<Text variant="body">A native popover — renders in the top layer, light-dismiss + Escape for free.</Text>
					</div>
				</Popover>

				<Menu label="Row actions" items={menuItems}>
					{#snippet trigger()}<Icon name="more" size={18} />{/snippet}
				</Menu>

				<Text variant="caption" tone="muted">Open a menu and navigate with ↑/↓, Enter to select.</Text>
			</div>
		</Card>
	</section>

	<!-- TABS -->
	<section class="section">
		<Heading level={2}>Tabs</Heading>
		<Card>
			<Tabs {tabs} bind:value={tabValue} label="Demo tabs">
				{#snippet panel(id)}
					{#if id === 'overview'}
						<Text variant="body">Overview panel — arrow keys move between tabs.</Text>
					{:else if id === 'activity'}
						<Text variant="body">Activity panel — roving tabindex keeps one tab tabbable.</Text>
					{:else}
						<Text variant="body">Settings panel — aria-controls links each tab to this panel.</Text>
					{/if}
				{/snippet}
			</Tabs>
		</Card>
	</section>

	<!-- TOASTS -->
	<section class="section">
		<Heading level={2}>Toasts</Heading>
		<Card>
			<div class="row row-wrap">
				<Button onclick={() => toasts.show('Saved to drafts')}>Neutral</Button>
				<Button variant="primary" onclick={() => toasts.ok('Changes published')}>Success</Button>
				<Button variant="danger" onclick={() => toasts.error('Something went wrong')}>Error</Button>
			</div>
		</Card>
	</section>

	<!-- DATATABLE -->
	<section class="section">
		<Heading level={2}>DataTable <Badge>generic &lt;T&gt;</Badge></Heading>
		<DataTable
			columns={tableCols}
			rows={tableRows}
			rowKey={(r) => r.id}
			onrowclick={(r) => toasts.show(`Row: ${r.name}`)}
			cellSnippets={{ status }}
		/>
		{#snippet status(r: Row)}
			<Badge tone={r.status === 'ok' ? 'ok' : r.status === 'warn' ? 'warn' : 'danger'}>
				{r.status}
			</Badge>
		{/snippet}
	</section>

	<!-- CARDS + MODAL -->
	<section class="section">
		<Heading level={2}>Card &amp; Modal</Heading>
		<div class="card-row">
			<Card>
				<Heading level={3} size="md">Static card</Heading>
				<Text variant="body" tone="muted">An elevated surface with token-driven padding, border and radius.</Text>
			</Card>
			<Card tap as="button" onclick={() => (modalOpen = true)}>
				<Heading level={3} size="md">Tappable card</Heading>
				<Text variant="body" tone="muted">Hover/press affordance. Click to open the modal.</Text>
			</Card>
		</div>
		<div class="row" style="margin-top: var(--sp-3)">
			<Button variant="primary" onclick={() => (modalOpen = true)}>Open modal</Button>
		</div>
	</section>

	<!-- TOKENS -->
	<section class="section">
		<Heading level={2}>Theme tokens</Heading>
		<Card>
			<div class="swatch-grid">
				{#each tokens as t (t)}
					<div class="swatch">
						<span class="chip-color" style={`background: var(${t})`}></span>
						<Text variant="caption" class="mono">{t}</Text>
					</div>
				{/each}
			</div>
		</Card>
	</section>

	<footer class="foot">
		<Text variant="caption" tone="faint">
			Edit <code>src/lib/styles/variables.css</code> to retheme everything · add a
			<code>[data-theme]</code> block for a new theme · components never hard-code a color or pixel.
		</Text>
	</footer>
</main>

{#if modalOpen}
	<Modal title="Example dialog" onclose={() => (modalOpen = false)} resizeKey="uikit-demo-modal">
		{#snippet body()}
		<div class="stack">
			<Text variant="body">
				Accessible dialog: <code>role="dialog"</code>, labelled by its title, Escape to
				close, click-outside to close, focus trapped inside, focus restored to the trigger on close.
				On desktop, drag the right edge to resize (persisted).
			</Text>
			<Field label="A field inside the modal" for="m-in">
				<Input id="m-in" placeholder="Focus starts here" />
			</Field>
		</div>
		{/snippet}
		{#snippet footer()}
			<div class="spacer"></div>
			<Button onclick={() => (modalOpen = false)}>Cancel</Button>
			<Button variant="primary" onclick={() => (modalOpen = false)}>Confirm</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
		padding-top: var(--safe-top);
	}
	.top-row {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
		height: var(--header-h);
	}
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--sp-6);
		padding-top: var(--sp-6);
		padding-bottom: var(--sp-12);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: var(--sp-3);
	}
	.form-grid,
	.card-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: var(--sp-4);
	}
	.opt-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
		gap: var(--sp-2);
	}
	/* Applied via `class` on child components (Field/Text), so they must be
	   global — the parent's scoped hash doesn't reach a child's root element. */
	:global(.span-2) {
		grid-column: 1 / -1;
	}
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
		gap: var(--sp-2);
	}
	.icon-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
		padding: var(--sp-2);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		color: var(--text-muted);
	}
	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--sp-3);
	}
	.swatch {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.chip-color {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: var(--r-sm);
		border: 1px solid var(--border-strong);
		flex: none;
	}
	.foot {
		margin-top: var(--sp-6);
		padding-top: var(--sp-4);
		border-top: 1px solid var(--border);
	}
	@media (max-width: 520px) {
		:global(.hide-sm) {
			display: none;
		}
	}
</style>
