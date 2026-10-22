<script module>
	export const meta = {
		title: 'Sizes, icons and collapsing labels',
		caption: 'size sm, md, lg; variant="icon" with labels; collapseLabels="mobile" hides text under the mobile breakpoint, "container" under 35rem of the nearest container.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SegmentedControl } from '@dorsk/tsumikit';
	import { libraryFilters, scopeModes } from './data';

	let filter = $state('monitored');
	let scope = $state('album');
</script>

<SegmentedControl size="sm" options={libraryFilters} bind:value={filter} label="Compact filter" />
<SegmentedControl size="md" options={libraryFilters} bind:value={filter} label="Default filter" />
<SegmentedControl size="lg" options={libraryFilters} bind:value={filter} label="Large filter" />
<SegmentedControl variant="icon" options={scopeModes} bind:value={scope} label="Scope" />
<SegmentedControl variant="icon" collapseLabels="mobile" options={scopeModes} bind:value={scope} label="Scope, labels hidden on phones" />
<div class="container">
	<SegmentedControl variant="icon" collapseLabels="container" options={scopeModes} bind:value={scope} label="Scope in a 20rem container" />
</div>

<style>
	.container {
		container-type: inline-size;
		max-width: 20rem;
	}
</style>
