<script module>
	export const meta = {
		title: 'States',
		caption: 'off, on, disabled in both states, invalid, and a Field with an error message; onclick still fires before the toggle.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Field, Switch, Text } from '@dorsk/tsumikit';

	let maintenance = $state(false);
	let clicks = $state(0);
</script>

<Cluster gap="var(--sp-4)">
	<Switch label="Off" labelVisible />
	<Switch checked label="On" labelVisible />
	<Switch disabled label="Disabled off" labelVisible />
	<Switch disabled checked label="Disabled on" labelVisible />
	<Switch invalid label="Invalid" labelVisible />
</Cluster>
<div style="max-width: 24rem">
	<Field label="Maintenance mode" error={maintenance ? 'All traffic is returning 503 while this is on.' : ''}>
	<Switch bind:checked={maintenance} label="Maintenance mode" onclick={() => clicks++} />
</Field>
</div>
<Text size="xs" tone="muted">onclick fired {clicks} time{clicks === 1 ? '' : 's'}.</Text>
