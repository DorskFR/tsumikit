<script module>
	export const meta = {
		title: 'States',
		caption: 'unchecked, checked, indeterminate, disabled in both states, invalid inside a Field error, and a long label that wraps under itself.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Checkbox, Cluster, Field } from '@dorsk/tsumikit';

	let agreed = $state(false);
</script>

<Cluster gap="var(--sp-4)">
	<Checkbox label="Unchecked" />
	<Checkbox checked label="Checked" />
	<Checkbox indeterminate label="Mixed" />
	<Checkbox disabled label="Disabled" />
	<Checkbox disabled checked label="Disabled, checked" />
	<Checkbox invalid label="Invalid" />
</Cluster>
<div style="max-width: 24rem">
	<Field error={agreed ? '' : 'You must accept the terms to continue.'}>
	<Checkbox bind:checked={agreed} label="I have read the data processing agreement and accept that logs are retained for 30 days in the selected region." />
</Field>
</div>
