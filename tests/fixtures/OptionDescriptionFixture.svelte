<script lang="ts">
	import OptionButton from '$lib/components/molecules/OptionButton.svelte';
	import RadioGroup, { type RadioOption } from '$lib/components/molecules/RadioGroup.svelte';

	let {
		variant = 'list',
		calls = [],
		buttonCalls = []
	}: { variant?: 'list' | 'rows' | 'swatch'; calls?: string[]; buttonCalls?: string[] } = $props();

	const options: RadioOption[] = [
		{ value: 'fast', label: 'Fast', description: 'Skips the review pass.' },
		{ value: 'careful', label: 'Careful', description: 'Reviews every file.' },
		{ value: 'plain', label: 'Plain' }
	];
	let value = $state('fast');
</script>

<RadioGroup label="Mode" name="mode" {variant} {options} bind:value onfocuschange={(v) => calls.push(v)} />

<div class="cards">
	<OptionButton value="a" description="First card." onfocuschange={(v) => buttonCalls.push(v)}>A</OptionButton>
	<OptionButton value="b" aria-describedby="ext" onfocuschange={(v) => buttonCalls.push(v)}>B</OptionButton>
	<OptionButton onfocuschange={(v) => buttonCalls.push(v)}>C</OptionButton>
</div>
<p id="ext">External help.</p>
