<script module>
	export const meta = {
		title: 'States',
		caption: 'empty with a placeholder, hotkey="s" with showHotkey, autoQuote off, showChips off, an unknown field kept as free text, and a long query wrapping its chips.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterSearchBar } from '@dorsk/tsumikit';
	import { fleetSchema } from './data';

	let empty = $state('');
	let hotkey = $state('');
	let bare = $state('name:api');
	let chipless = $state('role:worker status=warn');
	let unknown = $state('owner:platform cache');
	let long = $state(
		'role:worker status!=ok region=eu-west-1 cpu>=40 uptime<30 name:"media-transcode-pipeline-eu-west-1-blue" OR name:search-index'
	);
</script>

<FilterSearchBar schema={fleetSchema} bind:value={empty} placeholder="Try status=danger" />
<FilterSearchBar schema={fleetSchema} bind:value={hotkey} hotkey="s" showHotkey placeholder="Press S to search" />
<FilterSearchBar schema={fleetSchema} bind:value={bare} autoQuote={false} />
<FilterSearchBar schema={fleetSchema} bind:value={chipless} showChips={false} />
<FilterSearchBar schema={fleetSchema} bind:value={unknown} />
<FilterSearchBar schema={fleetSchema} bind:value={long} />
