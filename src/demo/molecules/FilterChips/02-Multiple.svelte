<script module>
	export const meta = {
		title: 'Several at once',
		caption: 'multiple binds a string[] and renders aria-pressed toggles; a count of 0 is shown, a disabled option is skipped; size="md" for roomier rows.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { FilterChips, Text } from '@dorsk/tsumikit';
	import { formats } from './data';

	let picked = $state<string[]>(['flac', 'opus']);
</script>

<FilterChips multiple options={formats} bind:value={picked} label="Format" />
<FilterChips multiple size="md" options={formats} bind:value={picked} label="Format, medium" />
<Text size="xs" tone="muted">{picked.length ? picked.join(', ') : 'Any format'}</Text>
