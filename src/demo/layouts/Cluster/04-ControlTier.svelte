<script module>
	export const meta = {
		title: 'Control height tier',
		caption: 'size="sm" | "md" | "lg" sets --control-height for children that opt in with control; grow shares the row equally.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, SegmentedControl, Text } from '@dorsk/tsumikit';

	const sizes = ['sm', 'md', 'lg'] as const;
	let range = $state('24h');
</script>

{#each sizes as size (size)}
	<Cluster {size}>
		<Text size="xs" mono tone="muted" style="width: 2rem">{size}</Text>
		<SegmentedControl
			control
			label="Range"
			bind:value={range}
			options={[
				{ value: '1h', label: '1h' },
				{ value: '24h', label: '24h' },
				{ value: '7d', label: '7d' }
			]}
		/>
		<Button control>Refresh</Button>
		<Button control variant="primary">Export</Button>
	</Cluster>
{/each}
<Cluster grow>
	<Button>Previous</Button>
	<Button variant="primary">Next</Button>
</Cluster>
