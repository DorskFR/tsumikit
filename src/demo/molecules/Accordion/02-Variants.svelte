<script module>
	export const meta = {
		title: 'Plain, compact and chevron side',
		caption: 'variant="plain" drops the outer border; size="compact" tightens to --fs-xs; chevron="start" | "end" | false.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Accordion, Text } from '@dorsk/tsumikit';

</script>

{#snippet body()}<Text size="sm" tone="muted">Rows of the group render here.</Text>{/snippet}

<div class="col">
	<Text size="xs" tone="muted">default</Text>
	<Accordion items={[{ id: 'a', title: 'Notifications', content: body, open: true }, { id: 'b', title: 'Privacy', content: body }]} />
</div>
<div class="col">
	<Text size="xs" tone="muted">plain · compact</Text>
	<Accordion variant="plain" size="compact" items={[{ id: 'a', title: 'Notifications', content: body, open: true }, { id: 'b', title: 'Privacy', content: body }]} />
</div>
<div class="col">
	<Text size="xs" tone="muted">chevron start</Text>
	<Accordion chevron="start" items={[{ id: 'a', title: 'Notifications', content: body, open: true }, { id: 'b', title: 'Privacy', content: body }]} />
</div>
<div class="col">
	<Text size="xs" tone="muted">no chevron</Text>
	<Accordion chevron={false} items={[{ id: 'a', title: 'Notifications', content: body, open: true }, { id: 'b', title: 'Privacy', content: body }]} />
</div>

<style>
	.col {
		display: grid;
		gap: var(--sp-2);
		min-width: 0;
	}
</style>
