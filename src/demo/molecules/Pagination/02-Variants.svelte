<script module>
	export const meta = {
		title: 'Sizes and shape',
		caption: 'size="sm" | "md" | "lg"; siblings widens the window around the current page; showEdges={false} drops first and last; block fills the row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Pagination } from '@dorsk/tsumikit';

	let page = $state(6);
</script>

<Pagination bind:page pageCount={12} size="sm" />
<Pagination bind:page pageCount={12} />
<Pagination bind:page pageCount={12} size="lg" />
<Pagination bind:page pageCount={12} siblings={2} />
<Pagination bind:page pageCount={12} siblings={0} />
<Pagination bind:page pageCount={12} showEdges={false} />
<Pagination bind:page pageCount={12} block />
