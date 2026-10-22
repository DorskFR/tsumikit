<script module>
	export const meta = {
		title: 'States',
		caption: 'a single page disables both arrows; an empty result set reads "0–0 / 0"; under 24rem of container width the numbers collapse to a range.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Pagination, Text } from '@dorsk/tsumikit';

	let page = $state(1);
	let compact = $state(4);
	let offset = $state(0);
</script>

<Pagination bind:page pageCount={1} />
<Pagination bind:offset limit={20} total={0} showRange />
<div class="narrow">
	<Pagination bind:page={compact} pageCount={12} showRange />
</div>
<Text size="xs" tone="muted">Compact page {compact} of 12</Text>

<style>
	.narrow {
		max-width: 18rem;
		border: 1px dashed var(--border);
		padding: var(--sp-2);
	}
</style>
