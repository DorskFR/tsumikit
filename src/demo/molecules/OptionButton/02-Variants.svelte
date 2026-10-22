<script module>
	export const meta = {
		title: 'Accent, row and block',
		caption: '--opt-accent per card; description is announced via aria-describedby; onfocuschange drives the preview on hover or arrow keys; row and block make left-aligned list items.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Callout, Icon, OptionButton, Text } from '@dorsk/tsumikit';
	import { permissions } from './data';

	let mode = $state('ask');
	let preview = $state('ask');
	let adapter = $state('claude');
	const previewText = $derived(permissions.find((p) => p.value === preview)?.preview ?? '');
</script>

<div class="grid">
	{#each permissions as p (p.value)}
		<OptionButton
			value={p.value}
			description={p.description}
			selected={mode === p.value}
			style="--opt-accent: {p.accent}"
			onfocuschange={(v) => (preview = v)}
			onclick={() => (mode = p.value)}
		>
			<Text weight="semibold">{p.label}</Text>
		</OptionButton>
	{/each}
</div>
<Callout tone="info">{previewText}</Callout>
<div class="list">
	{#each [['claude', 'Claude Code', 'zap'], ['codex', 'Codex', 'git-branch'], ['opencode', 'OpenCode', 'fork']] as const as [id, label, icon] (id)}
		<OptionButton row block align="start" selected={adapter === id} onclick={() => (adapter = id)}>
			<Icon name={icon} size={16} />
			<Text size="sm">{label}</Text>
		</OptionButton>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--sp-2);
		max-width: 32rem;
	}
	.list {
		display: grid;
		gap: var(--sp-1);
		max-width: 16rem;
	}
</style>
