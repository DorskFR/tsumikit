<script module>
	export const meta = {
		title: 'Dropdown chip',
		caption: 'collapse="always" is one chip that opens a menu of checkable items; the default collapse="auto" switches to it when the chips do not fit (drag the handle), at the same height.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { FilterChips, Text } from '@dorsk/tsumikit';
	import { formats, genres, statuses } from './data';

	let status = $state('missing');
	let picked = $state<string[]>(['flac', 'opus']);
	let genre = $state('jazz');
</script>

<Text size="xs" tone="muted">Always</Text>
<FilterChips collapse="always" options={statuses} bind:value={status} label="Status" />
<FilterChips collapse="always" multiple options={formats} bind:value={picked} label="Format" />
<Text size="xs" tone="muted">Auto, nine genres in a 20rem box</Text>
<div class="narrow">
	<FilterChips options={genres} bind:value={genre} label="Genre" data-demo="auto-narrow" />
</div>
<Text size="xs" tone="muted">Auto, as wide as this preview</Text>
<FilterChips options={genres} bind:value={genre} label="Genre, full width" data-demo="auto-wide" />

<style>
	.narrow {
		max-width: 20rem;
	}
</style>
