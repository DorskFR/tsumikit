<script module>
	export const meta = {
		title: 'Inline filter badges',
		caption: 'The inline snippet receives the parse context ({ filters, text, remove, focus }) and renders custom nodes inside the bar; below adds a row under it.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, FilterInput, Text } from '@dorsk/tsumikit';
	import { logSchema } from './data';

	let value = $state('level=error service=api-gateway timeout');
</script>

<FilterInput schema={logSchema} bind:value>
	{#snippet inline({ filters, remove })}
		{#each filters as f (f.span[0])}
			<Badge tone="info" size="xs" removable onremove={() => remove(f.span)}>{f.field}: {f.values.join(', ') || '∅'}</Badge>
		{/each}
	{/snippet}
	{#snippet below({ filters, text })}
		<Text size="xs" tone="muted">{filters.length} filter(s){text ? ` · free text "${text}"` : ''}</Text>
	{/snippet}
</FilterInput>
