<script module>
	export const meta = {
		title: 'States',
		caption: 'indeterminate (plain and striped), empty, complete, a value past max clamps to 100%, and grow/shrink inside a flex row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Progress, Text } from '@dorsk/tsumikit';
</script>

<Progress label="Importing" />
<Progress label="Reindexing" striped indeterminate />
<Progress value={0} label="Not started" showValue />
<Progress value={100} tone="success" label="Complete" showValue />
<Progress value={250} max={200} label="Clamped" showValue format={(v, m) => `${v}/${m} clamps to 100%`} />
<Cluster wrap={false}>
	<Text size="sm" nowrap>worker-02</Text>
	<Progress value={87} size="sm" grow toneAt={{ warn: 70, danger: 90 }} label="CPU" />
	<Button size="sm" variant="ghost">Details</Button>
</Cluster>
