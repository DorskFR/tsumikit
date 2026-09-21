<script lang="ts">
	import FilterInput from '../../src/lib/components/molecules/FilterInput.svelte';
	import type { FilterInputContext } from '../../src/lib/components/molecules/FilterInput.svelte';
	import type { Schema } from '../../src/lib/query/schema';

	let { value = $bindable(''), withDisplay = true }: { value?: string; withDisplay?: boolean } =
		$props();

	const schema: Schema = {
		fields: [{ name: 'cwd', label: 'Working directory', type: 'string' }]
	};
</script>

{#snippet path(ctx: FilterInputContext)}
	<span class="probe-display">{ctx.value.split('/').at(-1)}</span>
{/snippet}

<form>
	<button type="button" id="before">before</button>
	<label for="cwd">Working directory</label>
	<FilterInput
		{schema}
		key="cwd"
		id="cwd"
		bind:value
		showClear={false}
		display={withDisplay ? path : undefined}
	>
		{#snippet inline()}
			<span class="probe-inline">nanachi</span>
		{/snippet}
	</FilterInput>
	<button type="button" id="after">after</button>
</form>
