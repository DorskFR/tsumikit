<script module>
	export const meta = {
		title: 'Sizes, shapes and surfaces',
		caption: 'size="sm" | "md" | "lg", shape="pill", surface="raised" | "sunken", font="sans", a custom icon or icon={null}.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterInput } from '@dorsk/tsumikit';
	import { logSchema } from './data';

	let values = $state(['level=error', 'service=worker-02', 'status>=500', '', 'msg:"timeout"', 'level=warn']);
</script>

<div class="grid">
	<FilterInput schema={logSchema} bind:value={values[0]} size="sm" />
	<FilterInput schema={logSchema} bind:value={values[1]} size="md" surface="raised" />
	<FilterInput schema={logSchema} bind:value={values[2]} size="lg" surface="sunken" />
	<FilterInput schema={logSchema} bind:value={values[3]} shape="pill" font="sans" placeholder="Search logs" />
	<FilterInput schema={logSchema} bind:value={values[4]} icon="filter" />
	<FilterInput schema={logSchema} bind:value={values[5]} icon={null} />
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: var(--sp-3);
	}
</style>
