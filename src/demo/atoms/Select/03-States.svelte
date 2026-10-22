<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled control, disabled options, invalid via Field error, a placeholder-style empty choice and a long label that truncates.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Field, Select } from '@dorsk/tsumikit';
	import { regions } from './data';

	let region = $state('');
</script>

<Cluster>
	<Select disabled value="eu-west-1" options={regions} aria-label="Disabled" width="auto" />
	<Select invalid value="us-east-1" options={regions} aria-label="Invalid" width="auto" />
	<Select width="auto" value="" aria-label="Long option">
		<option value="">A very long option label that keeps going well past any sensible trigger width</option>
		<option value="short">Short</option>
	</Select>
</Cluster>
<div style="max-width: 20rem">
	<Field label="Region" error={region ? '' : 'Pick a region before deploying.'}>
	<Select bind:value={region} options={[{ value: '', label: 'Choose a region…' }, ...regions]} />
</Field>
</div>
