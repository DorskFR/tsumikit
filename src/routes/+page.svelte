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
		Dot,
		Link,
		Icon,
		Field,
		IconButton,
		SelectButton,
		Toggle,
		OptionButton,
		Modal,
		CopyButton,
		CodeBlock,
		FileButton,
		Dropzone,
		Tooltip,
		Truncate,
		Timestamp,
		Progress,
		Accordion,
		Popover,
		Menu,
		Tabs,
		RadioGroup,
		DataTable,
		toasts,
		Stack,
		Cluster,
		AutoGrid,
		ThemePicker,
		FontScalePicker,
		theme,
		type IconName,
		type MenuItem,
		type TabItem,
		type RadioOption,
		type Column
	} from '$lib';
	import { base } from '$app/paths';

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

	const sampleCode = `// install and use
import { Button, theme } from '@dorsk/tsumikit';

function greet(name) {
  return \`Hello, \${name}!\`;
}`;

	// Toy highlighter for the demo only — real apps plug in highlight.js / Prism
	// (class-based output is auto-themed via the --syn-* token mapping).
	function demoHighlight(src: string): string {
		const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return esc
			.replace(/(\/\/[^\n]*)/g, '<span class="hljs-comment">$1</span>')
			.replace(
				/\b(import|from|function|return|const|let)\b/g,
				'<span class="hljs-keyword">$1</span>'
			)
			.replace(/('[^']*'|`[^`]*`)/g, '<span class="hljs-string">$1</span>');
	}

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
		'back', 'arrow-right', 'arrow-up', 'arrow-down', 'chevron-up', 'chevron-down',
		'chevron-left', 'chevron-right', 'menu', 'more', 'external', 'log-out',
		'plus', 'minus', 'check', 'x', 'search', 'filter', 'copy', 'edit', 'trash',
		'save', 'download', 'upload', 'send', 'share', 'retry', 'settings',
		'play', 'pause', 'stop',
		'file', 'file-text', 'folder', 'archive', 'image', 'markdown', 'list', 'grid',
		'link', 'tag', 'bookmark', 'star', 'heart', 'fork', 'live', 'eye', 'eye-off',
		'lock', 'unlock', 'bell', 'mail', 'calendar', 'clock', 'home', 'user', 'users',
		'sun', 'moon', 'loader',
		'info', 'warning', 'help', 'check-circle', 'x-circle', 'alert-circle'
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
	<title>@dorsk/tsumikit — component showcase</title>
</svelte:head>

<header class="top">
	<div class="container top-row">
		<Heading level={1} size="lg">@dorsk/tsumikit</Heading>
		<Text variant="caption" class="hide-sm">Svelte 5 · pure CSS · zero deps</Text>
		<div class="spacer"></div>
		<Link href="{base}/shell" class="hide-sm">AppShell demo →</Link>
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
					<Text tone="success">success</Text>
					<Text tone="warn">warn</Text>
					<Text tone="danger">danger</Text>
				</div>
				<div class="row row-wrap">
					<Text weight="normal">normal</Text>
					<Text weight="medium">medium</Text>
					<Text weight="semibold">semibold</Text>
					<Text weight="bold">bold</Text>
				</div>
				<div class="row row-wrap">
					<Text numeric>numeric 1234.50%</Text>
					<Text>default 1234.50%</Text>
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
					<Button size="lg">Large</Button>
					<Button control>Control height</Button>
					<Button control variant="primary">Control primary</Button>
				</div>
				<div class="row row-wrap">
					<Button tone="accent">Notify on</Button>
					<Button tone="info">Cold</Button>
					<Button tone="warn">Warning</Button>
					<Button tone="warn" control>Send <Text numeric>0:09</Text></Button>
				</div>
				<Button block variant="primary">Block button</Button>
				<div class="row row-wrap">
					<CopyButton text="npm i @dorsk/tsumikit" />
					<CopyButton text="npm i @dorsk/tsumikit" variant="default" label="Copy install" />
					<Badge mono>npm i @dorsk/tsumikit</Badge>
				</div>
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
					<IconButton icon="trash" label="Remove" inline hoverDanger />
				</div>
				<div class="row row-wrap">
					<IconButton icon="chevron-left" label="Back" chip variant="default" />
					<IconButton icon="star" label="Pin" chip variant="default" tone="accent" />
					<IconButton icon="bell" label="Archive" chip variant="default" tone="warn" />
					<IconButton icon="trash" label="Interrupt" chip variant="default" tone="danger" hoverDanger />
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
		<Heading level={2}>Badge · Link · Dot</Heading>
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
					<Badge mono>~/path/to/file</Badge>
					<Badge as="button">interactive</Badge>
					<Badge removable onremove={() => {}}>removable</Badge>
					<Badge tone="info" removable onremove={() => {}}>typescript</Badge>
				</div>
				<div class="row row-wrap">
					<Badge uppercase>uppercase</Badge>
					<Badge uppercase tone="ok" size="sm">stable</Badge>
					<Badge as="button" tone="info" active>active count 3</Badge>
					<Badge as="button" tone="ok" active size="sm">on</Badge>
					<Badge as="button" tone="info">off</Badge>
				</div>
				<div class="row row-wrap">
					<Link href="https://svelte.dev" target="_blank" rel="noreferrer">Anchor link</Link>
					<Link>Button-as-link</Link>
				</div>
				<div class="row row-wrap">
					<Dot status="active" glow label="active" />
					<Dot status="stale" label="stale" />
					<Dot status="dead" label="dead" />
					<Dot status="hibernated" label="hibernated" />
					<Dot color="var(--accent)" label="custom" />
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
				<Field label="Select (compact, no chevron)" for="f-select-mini">
					<Select id="f-select-mini" compact chevron={false} bind:value={selectValue}>
						<option value="one">Option one</option>
						<option value="two">Option two</option>
						<option value="three">Option three</option>
					</Select>
				</Field>
				<Field label="Textarea (autoresize)" for="f-area" class="span-2">
					<Textarea id="f-area" autoresize bind:value={areaValue} />
				</Field>
				<Field label="Textarea (autoresize, starts at one row)" for="f-area-1" class="span-2">
					<Textarea id="f-area-1" autoresize rows={1} placeholder="One row when empty, grows as you type" />
				</Field>
				<Field label="Textarea (resize from bottom)" for="f-area-2" class="span-2">
					<Textarea id="f-area-2" rows={2} resize="bottom" placeholder="Drag the bottom grip" />
				</Field>
				<Field label="Textarea (resize from top)" for="f-area-3" class="span-2">
					<Textarea id="f-area-3" rows={2} resize="top" placeholder="Drag the top grip" />
				</Field>
				<Field label="Textarea (autoresize + top handle floor)" for="f-area-4" class="span-2">
					<Textarea
						id="f-area-4"
						autoresize
						resize="top"
						rows={1}
						placeholder="One row, grows as you type — drag the top grip to reserve more space"
					/>
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

	<!-- TOOLTIP / PROGRESS / ACCORDION -->
	<section class="section">
		<Heading level={2}>Tooltip · Progress · Accordion</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<Tooltip text="Tooltips appear on hover and keyboard focus, dismiss with Escape.">
						{#snippet trigger()}<Button>Hover or focus me</Button>{/snippet}
					</Tooltip>
					<Tooltip text="Also works on icon buttons." placement="bottom">
						{#snippet trigger()}<IconButton icon="info" label="Info" />{/snippet}
					</Tooltip>
				</div>
				<div class="stack">
					<Progress value={65} label="Upload progress" />
					<Progress value={45} tone="success" label="Healthy usage" />
					<Progress value={78} tone="warn" label="Warm usage" />
					<Progress value={94} tone="danger" label="Hot usage" />
					<Progress value={72} size="sm" label="Thin inline row" />
					<Progress value={58} gradient label="Storage meter (gradient)" />
					<Progress value={40} striped label="Unpacking (striped)" />
					<Progress value={40} gradient striped size="sm" label="Thin gradient striped" />
					<Progress indeterminate striped label="Importing…" />
					<Progress label="Working…" />
				</div>
				{#snippet c1()}<Text variant="body">Built on native &lt;details&gt; — zero JS, full keyboard support.</Text>{/snippet}
				{#snippet c2()}<Text variant="body">With <code>multiple=false</code> it uses the platform's exclusive-accordion (one open at a time).</Text>{/snippet}
				{#snippet c3()}<Text variant="body">The chevron rotates via a CSS transition on <code>[open]</code>.</Text>{/snippet}
				<Accordion
					multiple={false}
					items={[
						{ id: 'a', title: 'What is it?', content: c1, open: true },
						{ id: 'b', title: 'Single-open mode', content: c2 },
						{ id: 'c', title: 'Styling', content: c3 }
					]}
				/>
			</div>
		</Card>
	</section>

	<!-- TRUNCATE -->
	<section class="section">
		<Heading level={2}>Truncate <Badge>char-count · hover reveal</Badge></Heading>
		<Card>
			<div class="stack">
				<Text variant="caption">
					Character-count truncation (the counterpart to <code>&lt;Text truncate&gt;</code>'s CSS
					ellipsis). Hover or focus a truncated value to reveal the full text.
				</Text>
				<div class="stack">
					<Text variant="body">
						middle: <Truncate text="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" max={16} mode="middle" />
					</Text>
					<Text variant="body">
						end: <Truncate text="a-very-long-resource-identifier-that-keeps-going" max={20} />
					</Text>
					<Text variant="body">
						start: <Truncate text="/srv/app/var/logs/2026/06/14/request-trace.log" max={22} mode="start" />
					</Text>
					<Text variant="body">
						fits (no tooltip): <Truncate text="short" max={20} />
					</Text>
				</div>
			</div>
		</Card>
	</section>

	<!-- TIMESTAMP -->
	<section class="section">
		<Heading level={2}>Timestamp <Badge>subdued · click for UTC / epoch / zone</Badge></Heading>
		<Card>
			<div class="stack">
				<Text variant="caption">
					Renders an instant in one of five modes (date, time, datetime, relative, iso), subdued
					by default. The <code>date</code>/<code>time</code>/<code>datetime</code> modes follow
					the viewer's zone unless you pass <code>utc</code>. Click it for a read-only popover
					with the same instant as UTC, relative, your time zone and the unix epoch. Opt into
					<code>selectable</code> to let viewers switch the inline mode.
				</Text>
				<div class="stack">
					<Text variant="body">datetime: <Timestamp value="2026-06-14T07:30:00Z" /></Text>
					<Text variant="body">date: <Timestamp value="2026-06-14T07:30:00Z" mode="date" /></Text>
					<Text variant="body">
						date (utc): <Timestamp value="2026-06-14T07:30:00Z" mode="date" utc />
					</Text>
					<Text variant="body">iso: <Timestamp value="2026-06-14T07:30:00Z" mode="iso" /></Text>
					<Text variant="body">time: <Timestamp value="2026-06-14T07:30:00Z" mode="time" /></Text>
					<Text variant="body">
						relative: <Timestamp value={Date.now() - 7 * 86_400_000} mode="relative" />
					</Text>
					<Text variant="body">
						mono: <Timestamp value="2026-06-14T07:30:00Z" mono />
					</Text>
					<Text variant="body">
						selectable: <Timestamp value="2026-06-14T07:30:00Z" mode="relative" selectable />
					</Text>
					<Text variant="body">
						no popover: <Timestamp value="2026-06-14T07:30:00Z" details={false} />
					</Text>
				</div>
			</div>
		</Card>
	</section>

	<!-- CODE BLOCK -->
	<section class="section">
		<Heading level={2}>CodeBlock <Badge>BYO highlighter</Badge></Heading>
		<div class="stack">
			<CodeBlock code={sampleCode} lang="typescript" highlight={demoHighlight} showLineNumbers />
			<Text variant="caption" tone="muted">
				Plain (no highlighter, no line numbers):
			</Text>
			<CodeBlock code={`git clone …\nnpm install\nnpm run dev`} filename="setup.sh" />
		</div>
	</section>

	<!-- FILE UPLOAD -->
	<section class="section">
		<Heading level={2}>FileButton &amp; Dropzone</Heading>
		<Card>
			<div class="stack">
				<div class="row row-wrap">
					<FileButton
						variant="primary"
						label="Choose files"
						multiple
						onfiles={(f) => toasts.ok(`Picked ${f.length} file(s): ${f.map((x) => x.name).join(', ')}`)}
					/>
					<Text variant="caption" tone="muted">native picker, keyboard-focusable</Text>
				</div>
				<Dropzone
					accept="image/*,.pdf"
					onfiles={(f) => toasts.show(`Dropped ${f.length}: ${f.map((x) => x.name).join(', ')}`)}
				/>
				<Text variant="caption" tone="muted">overlay mode — wraps content, drop UI shows only while dragging a file over it</Text>
				<Dropzone
					overlay
					accept="image/*,.pdf"
					label="Drop files to attach"
					onfiles={(f) => toasts.show(`Dropped ${f.length}: ${f.map((x) => x.name).join(', ')}`)}
				>
					<Card padding="lg">
						<Heading level={3} size="md">Drawer-like surface</Heading>
						<Text variant="body" tone="muted">Buttons and content stay clickable. Drag a file anywhere over this card.</Text>
						<div class="row" style="margin-top: var(--sp-3)">
							<Button onclick={() => toasts.ok('Click still works')}>A button</Button>
						</div>
					</Card>
				</Dropzone>
			</div>
		</Card>
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
		<div class="card-row" style="margin-top: var(--sp-4)">
			<Card stacked>
				<Heading level={3} size="md">Stacked card</Heading>
				<Text variant="body" tone="muted">Looks like a pile — two layers peek out bottom-right.</Text>
			</Card>
			<Card stacked stackTone="info">
				<Heading level={3} size="md">Stacked (info)</Heading>
				<Text variant="body" tone="muted">Back layers tinted with the info/blue hue.</Text>
			</Card>
		</div>
		<div class="row" style="margin-top: var(--sp-3)">
			<Button variant="primary" onclick={() => (modalOpen = true)}>Open modal</Button>
		</div>
	</section>

	<!-- LAYOUT -->
	<section class="section">
		<Heading level={2}>Layout: Stack · Cluster · AutoGrid</Heading>
		<Card>
			<Stack gap="var(--sp-4)">
				<Text variant="caption" tone="muted">Cluster — wraps, never overflows:</Text>
				<Cluster>
					{#each ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'] as t (t)}
						<Badge>{t}</Badge>
					{/each}
				</Cluster>
				<Text variant="caption" tone="muted">AutoGrid — columns adapt to available width (resize the window):</Text>
				<AutoGrid min="10rem">
					{#each Array(6) as _, i (i)}
						<Card><Text weight="semibold">Cell {i + 1}</Text></Card>
					{/each}
				</AutoGrid>
				<Text variant="caption" tone="muted">AutoGrid — capped column width (max), left-packed instead of stretching:</Text>
				<AutoGrid min="12rem" max="16rem">
					{#each Array(3) as _, i (i)}
						<Card><Text weight="semibold">Fixed {i + 1}</Text></Card>
					{/each}
				</AutoGrid>
			</Stack>
		</Card>
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

	<!-- OPTIONAL: in-app text scaling -->
	<section class="section">
		<Heading level={2}>Text scaling <Badge>opt-in</Badge></Heading>
		<Card>
			<div class="row row-wrap">
				<FontScalePicker />
				<Text variant="caption" tone="muted">
					Optional in-app text-size control (drives <code>--fs-scale</code>, text tokens only).
					Most apps should rely on browser zoom and the user's OS/browser font-size instead —
					the kit is <code>rem</code>-based and never resets the root size, so both are respected
					out of the box. Reach for this only in reading-dense apps (chat, docs) that want to grow
					body text while keeping chrome compact.
				</Text>
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
	<Modal title="Example dialog" onclose={() => (modalOpen = false)} resizeKey="tsumikit-demo-modal">
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
