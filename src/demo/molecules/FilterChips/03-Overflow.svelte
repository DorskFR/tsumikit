<script module>
	export const meta = {
		title: 'Overflow',
		caption: 'collapse="never" keeps the row: it scrolls sideways and fades only an edge that hides chips, and the selected chip is scrolled into view. A row that fits has no fade.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterChips, Text } from '@dorsk/tsumikit';
	import { genres, statuses } from './data';

	let genre = $state('all');
	let status = $state('all');
</script>

<Text size="xs" tone="muted">Nine genres in a 20rem box</Text>
<div class="narrow">
	<FilterChips collapse="never" options={genres} bind:value={genre} label="Genre" data-demo="overflowing" />
</div>
<Text size="xs" tone="muted">Three statuses that fit</Text>
<div class="roomy">
	<FilterChips collapse="never" options={statuses.slice(0, 3)} bind:value={status} label="Status, fitting" data-demo="fitting" />
</div>

<style>
	.narrow {
		max-width: 20rem;
	}
	.roomy {
		max-width: 32rem;
	}
</style>
