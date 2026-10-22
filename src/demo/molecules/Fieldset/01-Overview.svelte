<script module>
	export const meta = {
		title: 'Notification settings',
		caption: 'legend groups related controls; tone and dashed set the frame; padding="sm" tightens a short group.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Checkbox, Fieldset, Select, Switch } from '@dorsk/tsumikit';

	let deploys = $state(true);
	let incidents = $state(true);
	let digests = $state(false);
	let quiet = $state(true);
</script>

<div class="settings">
	<Fieldset legend="Email me about">
		<div class="list">
			<Checkbox bind:checked={deploys} label="Deploys to production" />
			<Checkbox bind:checked={incidents} label="Incidents on services I own" />
			<Checkbox bind:checked={digests} label="Weekly usage digest" />
		</div>
	</Fieldset>
	<Fieldset legend="Quiet hours" tone="neutral" dashed={false} padding="sm">
		<div class="row">
			<Switch checked={quiet} label="Pause pushes overnight" labelVisible onclick={() => (quiet = !quiet)} />
			<Select
				value="22-07"
				width="auto"
				options={[
					{ value: '22-07', label: '22:00 to 07:00' },
					{ value: '00-06', label: '00:00 to 06:00' }
				]}
			/>
		</div>
	</Fieldset>
</div>

<style>
	.settings {
		display: grid;
		gap: var(--sp-4);
		max-width: 28rem;
	}
	.list {
		display: grid;
		gap: var(--sp-2);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-3);
		align-items: center;
	}
</style>
