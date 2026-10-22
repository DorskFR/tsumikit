<script module>
	export const meta = {
		title: 'New deployment form',
		caption: 'options with group renders native optgroups; hint is the muted right-aligned text; children work as plain <option>s.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Field, Select, Stack, Text } from '@dorsk/tsumikit';
	import { accounts, regions, sizes } from './data';

	let region = $state('eu-west-1');
	let account = $state('auto');
	let size = $state('medium');
</script>

<Stack gap="var(--sp-3)" style="max-width: 26rem">
	<Field label="Region" hint="Latency is measured from the current browser.">
		<Select bind:value={region} options={regions} />
	</Field>
	<Field label="Billing account">
		<Select bind:value={account} options={accounts} />
	</Field>
	<Field label="Instance size">
		<Select bind:value={size}>
			{#each sizes as s (s.value)}
				<option value={s.value}>{s.label}</option>
			{/each}
		</Select>
	</Field>
	<Cluster justify="space-between">
		<Text size="sm" tone="muted">{size} in {region} on {account}</Text>
		<Button variant="primary">Deploy</Button>
	</Cluster>
</Stack>
