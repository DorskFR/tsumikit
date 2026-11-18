<script module>
	export const meta = {
		title: 'List rows',
		caption: 'row makes flush rows for a rounded, clipped list: square corners and no shadow; hover keeps the wash but drops the edge ring, lift and press scale.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Text } from '@dorsk/tsumikit';

	const sessions = [
		{ name: 'deploy-api', status: 'Needs input', attention: true },
		{ name: 'refactor-auth', status: 'Running · 4 min', attention: false },
		{ name: 'docs-sweep', status: 'Idle', attention: false }
	];
	let opened = $state('');
</script>

<div class="list">
	{#each sessions as s (s.name)}
		<Card row interactive padding="sm" border="none" tone={s.attention ? 'attention' : 'neutral'} onclick={() => (opened = s.name)} gap="var(--sp-1)">
			<Text weight="semibold">{s.name}</Text>
			<Text size="sm" tone="muted">{s.status}{opened === s.name ? ' · opened' : ''}</Text>
		</Card>
	{/each}
</div>

<style>
	.list {
		display: grid;
		gap: 1px;
		max-width: 24rem;
		background: var(--border);
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		overflow: hidden;
	}
</style>
