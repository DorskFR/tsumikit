<script module>
	export const meta = {
		title: 'Sizes, variants and widths',
		caption: 'size="sm" matches toolbar height; variant="embedded" is borderless on an elevated surface; chevron={false}; width="auto" hugs the selection.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Card, Cluster, Select, Text } from '@dorsk/tsumikit';
	import { accounts } from './data';

	let sort = $state('recent');
	let account = $state('personal');
</script>

<Cluster>
	<Select size="sm" bind:value={sort} aria-label="Sort (small)" width="auto">
		<option value="recent">Most recent</option>
		<option value="name">Name</option>
		<option value="size">Size</option>
	</Select>
	<Select size="md" bind:value={sort} aria-label="Sort (medium)" width="auto">
		<option value="recent">Most recent</option>
		<option value="name">Name</option>
		<option value="size">Size</option>
	</Select>
	<Select size="sm" chevron={false} bind:value={sort} aria-label="Sort (no chevron)" width="auto">
		<option value="recent">Most recent</option>
		<option value="name">Name</option>
		<option value="size">Size</option>
	</Select>
</Cluster>
<Card surface="raised" padding="sm">
	<Cluster justify="space-between">
		<Text size="sm">Spawn with</Text>
		<Select variant="embedded" width="auto" bind:value={account} options={accounts} aria-label="Account" />
	</Cluster>
</Card>
<Select bind:value={account} options={accounts} aria-label="Account, full width" />
