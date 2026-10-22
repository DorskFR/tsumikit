<script module>
	export const meta = {
		title: 'Sizes, shapes and surfaces',
		caption: 'size="sm" | "md" | "lg", shape="pill", surface="raised" | "sunken", font="sans" for a plain search box; grow fills a toolbar row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, FilterSearchBar } from '@dorsk/tsumikit';
	import { fleetSchema } from './data';

	let small = $state('role:cache');
	let medium = $state('status=warn');
	let large = $state('region=us-east-1');
	let library = $state('');
	let toolbar = $state('');
</script>

<FilterSearchBar schema={fleetSchema} bind:value={small} size="sm" />
<FilterSearchBar schema={fleetSchema} bind:value={medium} size="md" surface="raised" />
<FilterSearchBar schema={fleetSchema} bind:value={large} size="lg" surface="sunken" />
<FilterSearchBar schema={fleetSchema} bind:value={library} shape="pill" font="sans" placeholder="Search services…" />
<Cluster align="center">
	<FilterSearchBar schema={fleetSchema} bind:value={toolbar} size="sm" grow showChips={false} placeholder="Filter" />
	<Button size="sm" variant="primary">New service</Button>
</Cluster>
