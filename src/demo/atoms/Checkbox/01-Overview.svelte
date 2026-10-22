<script module>
	export const meta = {
		title: 'Select rows with a header checkbox',
		caption: 'indeterminate shows a mixed header while some rows are checked; bind:checked drives each row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Checkbox, Cluster, Stack, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	let picked = $state<Record<number, boolean>>(
		Object.fromEntries(services.map((s) => [s.id, s.id === 2 || s.id === 6]))
	);
	const count = $derived(services.filter((s) => picked[s.id]).length);
	const all = $derived(count === services.length);
	function setAll(on: boolean) {
		picked = Object.fromEntries(services.map((s) => [s.id, on]));
	}
</script>

<Stack gap="var(--sp-2)" style="max-width: 28rem">
	<Cluster justify="space-between">
		<Checkbox label="Select all" checked={all} indeterminate={count > 0 && !all} onchange={(e) => setAll(e.currentTarget.checked)} />
		<Button size="sm" variant="danger" disabled={count === 0}>Restart {count || ''}</Button>
	</Cluster>
	{#each services as s (s.id)}
		<Cluster justify="space-between">
			<Checkbox bind:checked={picked[s.id]} label={s.name} />
			<Cluster gap="var(--sp-2)">
				<Text size="xs" tone="muted" mono>{s.region}</Text>
				<Badge tone={s.status === 'ok' ? 'success' : s.status} size="sm">{s.status}</Badge>
			</Cluster>
		</Cluster>
	{/each}
</Stack>
