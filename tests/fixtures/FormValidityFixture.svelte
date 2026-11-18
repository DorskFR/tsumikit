<script lang="ts">
	import Checkbox from '../../src/lib/components/atoms/Checkbox.svelte';
	import Input from '../../src/lib/components/atoms/Input.svelte';
	import Select from '../../src/lib/components/atoms/Select.svelte';
	import Textarea from '../../src/lib/components/atoms/Textarea.svelte';
	import Field from '../../src/lib/components/molecules/Field.svelte';

	let { emailError, presetError }: { emailError?: string; presetError?: string } = $props();
	let email = $state('');
	let notes = $state('');
	let plan = $state('');
	let terms = $state(false);
	let loose = $state('');
</script>

<form id="form">
	<Field label="Email" for="email" error={emailError}>
		<Input id="email" type="email" required bind:value={email} />
	</Field>
	<Field label="Notes" for="notes">
		<Textarea id="notes" required bind:value={notes} />
	</Field>
	<Field label="Plan" for="plan">
		<Select id="plan" required bind:value={plan}>
			<option value="">Pick one</option>
			<option value="pro">Pro</option>
		</Select>
	</Field>
	<Field label="Terms" for="terms">
		<Checkbox id="terms" label="Accept" required bind:checked={terms} />
	</Field>
	<Field label="Preset" for="preset" error={presetError}>
		<Input id="preset" />
	</Field>
	<Input id="loose" aria-label="Loose" required bind:value={loose} />
	<button type="button" id="other">Other</button>
</form>
