<script module>
	export const meta = {
		title: 'Collection sync banner',
		caption: 'tone and title set the frame; actions is a trailing snippet; dismissible adds the close control and ondismiss fires.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Callout, Text } from '@dorsk/tsumikit';

	let phase = $state<'searching' | 'review' | 'done' | 'hidden'>('searching');
	$effect(() => {
		if (phase !== 'searching') return;
		const t = setTimeout(() => (phase = 'review'), 2500);
		return () => clearTimeout(t);
	});
</script>

{#if phase === 'searching'}
	<Callout tone="info" busy>Searching MusicBrainz for 48 releases…</Callout>
{:else if phase === 'review'}
	<Callout tone="warn" title="3 releases need review">
		Several candidates matched; they were left unlinked so you can pick the right pressing.
		{#snippet actions()}
			<Button size="sm" variant="ghost" onclick={() => (phase = 'done')}>Skip</Button>
			<Button size="sm" onclick={() => (phase = 'done')}>Review</Button>
		{/snippet}
	</Callout>
{:else if phase === 'done'}
	<Callout tone="ok" title="Linked" dismissible ondismiss={() => (phase = 'hidden')}>
		45 releases matched and were linked to this collection.
	</Callout>
{:else}
	<Button size="sm" variant="ghost" onclick={() => (phase = 'searching')}>Run the sync again</Button>
{/if}
<Text size="xs" tone="faint">The banner walks searching → review → linked → dismissed.</Text>
