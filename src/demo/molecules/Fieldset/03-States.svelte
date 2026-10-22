<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled greys the frame and its controls; bind:over paints the drop highlight from pointer-driven drag and drop; an empty zone shows its hint.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Button, Checkbox, Fieldset, Text } from '@dorsk/tsumikit';

	let over = $state(false);
</script>

<Fieldset legend="Archived project" disabled>
	<Checkbox checked label="Notify on changes" />
	<Text size="xs" tone="muted">Restore the project to edit these.</Text>
</Fieldset>
<Fieldset legend="Drop highlight" droppable bind:over dropHint="Release to move here">
	<Text size="sm" tone="muted">The highlight is a bindable prop, so a pointer-based list can drive it.</Text>
	<Button size="sm" onclick={() => (over = !over)}>{over ? 'Clear highlight' : 'Simulate hover'}</Button>
</Fieldset>
<Fieldset legend="Empty pool" tone="strong">
	<Text size="sm" tone="muted">Nothing here yet. Drop a card or use its Move action.</Text>
</Fieldset>
