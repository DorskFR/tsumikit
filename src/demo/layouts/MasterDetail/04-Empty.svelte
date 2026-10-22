<script module>
	export const meta = {
		title: 'Empty folder',
		caption: 'An EmptyState in the list and the empty snippet in the detail column while nothing is selected.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { EmptyState, MasterDetail, Text } from '@dorsk/tsumikit';
</script>

<MasterDetail
	breakpoint="36rem"
	style="height: 15rem; border: 1px solid var(--border); border-radius: var(--r-md)"
>
	{#snippet list()}
		<EmptyState icon="archive" title="Archive is empty" description="Archived threads land here." size="compact" />
	{/snippet}
	{#snippet detail()}{/snippet}
	{#snippet empty()}
		<Text tone="muted" style="padding: var(--sp-4)">No message selected</Text>
	{/snippet}
</MasterDetail>
