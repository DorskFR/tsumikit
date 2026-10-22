<script module>
	export const meta = {
		title: 'Stack and inline layouts',
		caption: 'layout="inline" puts the label beside the control; labelWidth aligns a column of them; grow fills a Cluster row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Field, Input, Select, Switch } from '@dorsk/tsumikit';

	let autoDeploy = $state(true);
</script>

<Cluster align="flex-end">
	<Field label="Branch" grow>
		<Input value="main" mono />
	</Field>
	<Field label="Replicas" shrink={false}>
		<Input type="number" value="3" width="6rem" />
	</Field>
</Cluster>
<div class="inline">
	<Field label="Service" layout="inline" labelWidth="6rem">
		<Input value="api-gateway" mono grow />
	</Field>
	<Field label="Runtime" layout="inline" labelWidth="6rem" hint="Node 26 is the default.">
		<Select
			value="node26"
			options={[
				{ value: 'node26', label: 'Node 26' },
				{ value: 'node24', label: 'Node 24' },
				{ value: 'bun', label: 'Bun 2' }
			]}
		/>
	</Field>
	<Field label="Auto deploy" layout="inline" labelWidth="6rem">
		<Switch checked={autoDeploy} label="Deploy on push" onclick={() => (autoDeploy = !autoDeploy)} />
	</Field>
</div>

<style>
	.inline {
		display: grid;
		gap: var(--sp-2);
		max-width: 32rem;
	}
</style>
