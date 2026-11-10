<script lang="ts">
	import FilterChips, { type FilterChipOption } from '../../src/lib/components/molecules/FilterChips.svelte';

	let {
		log,
		value = $bindable(),
		options = [
			{ id: 'all', label: 'All', count: 3047 },
			{ id: 'missing', label: 'Missing', count: 0 },
			{ id: 'locked', label: 'Locked', count: 5, disabled: true },
			{ id: 'complete', label: 'Complete' }
		],
		...props
	}: {
		log: (string | string[])[];
		value?: string | string[];
		options?: FilterChipOption[];
		[key: string]: unknown;
	} = $props();
</script>

<FilterChips {options} bind:value label="Status" onchange={(v) => log.push(v)} {...props} />
<output id="value">{JSON.stringify(value ?? null)}</output>
