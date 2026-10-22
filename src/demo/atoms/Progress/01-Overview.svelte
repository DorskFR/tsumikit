<script module>
	export const meta = {
		title: 'Transfers and quota',
		caption: 'showValue adds a readout; toneAt turns the fill warn/danger past a percentage; markers draw caps; value omitted = indeterminate.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Progress, Stack, Text } from '@dorsk/tsumikit';
	import { files } from '../../fixtures';

	let done = $state([0.92, 1, 0.37, 0, 0.61]);
	$effect(() => {
		const t = setInterval(() => (done = done.map((d) => (d >= 1 ? 1 : Math.min(1, d + 0.02)))), 400);
		return () => clearInterval(t);
	});
	const mb = (n: number) => `${(n / 1_048_576).toFixed(1)} MB`;
</script>

<Stack gap="var(--sp-3)" style="max-width: 32rem">
	{#each files as f, i (f.name)}
		<div class="row">
			<Text size="sm" truncate style="flex: 1 1 0; min-width: 0">{f.name}</Text>
			<Text size="xs" tone="muted" numeric nowrap>{mb(f.size * done[i])} / {mb(f.size)}</Text>
			<Progress value={done[i] * 100} size="sm" tone={done[i] >= 1 ? 'success' : 'accent'} label="Upload {f.name}" shrink={false} style="width: 8rem" />
		</div>
	{/each}
	<Progress label="Scanning for duplicates" striped />
	<Progress value={184} max={200} label="Storage" showValue format={(v, m) => `${v} / ${m} GB`} toneAt={{ warn: 75, danger: 90 }} markers={[{ at: 150, label: 'Soft cap' }, { at: 190, label: 'Hard cap', tone: 'danger' }]} />
</Stack>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-3);
	}
</style>
