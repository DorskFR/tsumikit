<script module>
	export const meta = {
		title: 'States',
		caption: 'a disabled option in each variant, no selection yet, and long labels and descriptions wrapping inside a narrow column.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { RadioGroup } from '@dorsk/tsumikit';

	let region = $state<string | undefined>();
</script>

<RadioGroup
	label="Delivery"
	value="email"
	options={[
		{ value: 'email', label: 'Email', hint: 'Daily digest' },
		{ value: 'sms', label: 'SMS', hint: 'Urgent only' },
		{ value: 'none', label: 'None', hint: 'Requires an admin', disabled: true }
	]}
/>
<RadioGroup
	label="Region (nothing picked yet)"
	bind:value={region}
	variant="rows"
	options={[
		{ value: 'eu', label: 'Europe', description: 'Ireland, Frankfurt' },
		{ value: 'us', label: 'United States', description: 'Virginia, Oregon' },
		{ value: 'ap', label: 'Asia Pacific', description: 'Sold out this quarter', disabled: true }
	]}
/>
<div class="narrow">
	<RadioGroup
		label="Retention"
		variant="rows"
		value="long"
		options={[
			{
				value: 'long',
				label: 'Keep every build artefact and its full log output for the lifetime of the project',
				note: 'recommended for audited workspaces',
				description: 'Storage grows without bound; the quota alert fires at 80% so nobody is surprised by a full disk.'
			},
			{ value: 'short', label: '30 days', description: 'Enough to bisect a regression.' }
		]}
	/>
</div>

<style>
	.narrow {
		max-width: 14rem;
	}
</style>
