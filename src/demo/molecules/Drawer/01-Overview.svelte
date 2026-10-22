<script module>
	export const meta = {
		title: 'Provider settings',
		caption: 'bind:open, title + page + icon in the header, a nav snippet of NavItems beside the content, a sticky footer.',
	};
</script>

<script lang="ts">
	import { Button, Drawer, Field, Input, NavItem, Switch, Text, toasts, type IconName } from '@dorsk/tsumikit';

	const pages: { id: string; label: string; icon: IconName }[] = [
		{ id: 'general', label: 'General', icon: 'settings' },
		{ id: 'credentials', label: 'Credentials', icon: 'key-round' },
		{ id: 'limits', label: 'Limits', icon: 'zap' }
	];
	let open = $state(false);
	let page = $state('general');
	let form = $state({ name: 'Anthropic', url: 'https://api.anthropic.com', key: '', rpm: 60, stream: true });
	const current = $derived(pages.find((p) => p.id === page));
</script>

<Button variant="primary" onclick={() => (open = true)}>Configure provider</Button>

<Drawer bind:open title="Provider" page={current?.label} icon="settings">
	{#snippet nav()}
		{#each pages as p (p.id)}
			<NavItem icon={p.icon} label={p.label} active={page === p.id} onclick={() => (page = p.id)} />
		{/each}
	{/snippet}
	<div class="form">
		{#if page === 'general'}
			<Field label="Display name" for="pv-name"><Input id="pv-name" bind:value={form.name} /></Field>
			<Field label="Base URL" for="pv-url"><Input id="pv-url" bind:value={form.url} mono /></Field>
			<Switch label="Stream responses" bind:checked={form.stream} />
		{:else if page === 'credentials'}
			<Field label="API key" for="pv-key" hint="Stored encrypted, never shown again."><Input id="pv-key" type="password" bind:value={form.key} placeholder="sk-ant-…" /></Field>
		{:else}
			<Field label="Requests per minute" for="pv-rpm"><Input id="pv-rpm" type="number" bind:value={form.rpm} /></Field>
		{/if}
	</div>
	{#snippet footer()}
		<Text variant="caption" tone="faint">2 unsaved changes</Text>
		<span class="spacer"></span>
		<Button onclick={() => (open = false)}>Cancel</Button>
		<Button variant="primary" onclick={() => { open = false; toasts.ok('Provider saved'); }}>Save</Button>
	{/snippet}
</Drawer>

<style>
	.form {
		display: grid;
		gap: var(--sp-3);
	}
	.spacer {
		flex: 1;
	}
</style>
