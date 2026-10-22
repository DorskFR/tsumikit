<script module>
	export const meta = {
		title: 'Uneven content and a lone card',
		caption: 'align="start" (default) keeps short cards short, align="stretch" equalises a row; a single result stretches under auto-fit but keeps its width with max.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, Card, Text } from '@dorsk/tsumikit';

	const aligns = ['start', 'stretch'] as const;
	const notes = [
		'Rotate keys.',
		'Postgres failover drill moved to Thursday; the read replica in eu-west-1 needs a fresh base backup before then.',
		'Ship the changelog.'
	];
</script>

{#each aligns as align (align)}
	<Text size="xs" mono tone="muted">align="{align}"</Text>
	<AutoGrid min="11rem" {align} gap="var(--sp-2)">
		{#each notes as note (note)}
			<Card padding="sm"><Text size="sm">{note}</Text></Card>
		{/each}
	</AutoGrid>
{/each}
<Text size="xs" mono tone="muted">one item, default vs max="16rem"</Text>
<AutoGrid min="11rem" gap="var(--sp-2)">
	<Card padding="sm"><Text size="sm">1 search result</Text></Card>
</AutoGrid>
<AutoGrid min="11rem" max="16rem" gap="var(--sp-2)">
	<Card padding="sm"><Text size="sm">1 search result</Text></Card>
</AutoGrid>
