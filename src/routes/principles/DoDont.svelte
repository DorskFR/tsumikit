<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card, Icon, Text } from '@dorsk/tsumikit';

	let {
		good,
		bad,
		goodNote,
		badNote,
	}: {
		good: Snippet;
		bad: Snippet;
		goodNote: string;
		badNote: string;
	} = $props();
</script>

<div class="pair">
	<Card surface="raised" border="none" padding="md">
		<div class="side">
			<Text variant="eyebrow" tone="ok" class="verdict"><Icon name="check" size={14} /> Do</Text>
			<div class="live">{@render good()}</div>
			<Text variant="caption" tone="muted">{goodNote}</Text>
		</div>
	</Card>
	<Card surface="sunken" border="none" padding="md">
		<div class="side">
			<Text variant="eyebrow" tone="danger" class="verdict"><Icon name="x" size={14} /> Don't</Text>
			<div class="live">{@render bad()}</div>
			<Text variant="caption" tone="muted">{badNote}</Text>
		</div>
	</Card>
</div>

<style>
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--sp-4);
		margin-block-start: var(--sp-4);
	}
	.side {
		display: grid;
		gap: var(--sp-3);
		align-content: start;
		min-inline-size: 0;
	}
	.side :global(.verdict) {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	.live {
		display: grid;
		gap: var(--sp-2);
		align-content: start;
		min-inline-size: 0;
	}
</style>
