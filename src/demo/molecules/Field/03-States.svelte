<script module>
	export const meta = {
		title: 'States',
		caption: 'error overrides hint, a disabled control, an explicit for id, and a long label and error inside a narrow column.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Field, Input } from '@dorsk/tsumikit';
</script>

<div class="grid">
	<Field label="Email" hint="We only use it for login links." error="Enter a valid email address.">
		<Input value="amara@" type="email" />
	</Field>
	<Field label="Owner" hint="Transfer ownership from the members page.">
		<Input value="amara" disabled />
	</Field>
	<Field label="API key" for="demo-api-key">
		<Input id="demo-api-key" mono value="sk_live_…" readonly />
	</Field>
	<div class="narrow">
		<Field
			label="Maximum concurrent transcoding jobs per worker node"
			error="Must be between 1 and 32; the current value exceeds what the node's memory can hold."
		>
			<Input type="number" value="64" />
		</Field>
	</div>
</div>

<style>
	.grid {
		display: grid;
		gap: var(--sp-3);
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		max-width: 40rem;
	}
	.narrow {
		max-width: 12rem;
	}
</style>
