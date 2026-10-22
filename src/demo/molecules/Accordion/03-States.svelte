<script module>
	export const meta = {
		title: 'States and rich summaries',
		caption: 'a disabled item, a summary snippet receiving { open, item }, per-item onchange and long content that scrolls the page, not the panel.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Accordion, Badge, Dot, Text, type AccordionHeaderContext } from '@dorsk/tsumikit';

	let log = $state<string[]>([]);
	const steps = ['Checkout', 'Install', 'Lint', 'Typecheck', 'Unit tests', 'Build', 'Publish', 'Smoke test'];
</script>

{#snippet stage({ open, item }: AccordionHeaderContext)}
	<Dot status={open ? 'active' : 'hibernated'} />
	<span>{item.title}</span>
	<Badge size="xs" tone={item.disabled ? 'neutral' : open ? 'ok' : 'info'}>{item.disabled ? 'skipped' : open ? 'running' : 'queued'}</Badge>
{/snippet}
{#snippet short()}<Text size="sm" tone="muted">Nothing to show yet.</Text>{/snippet}
{#snippet long()}
	<ol class="steps">
		{#each steps as step, i (step)}<li><Text mono size="xs">{String(i + 1).padStart(2, '0')}</Text> <Text size="sm">{step}</Text></li>{/each}
	</ol>
{/snippet}

<Accordion
	variant="plain"
	size="compact"
	onchange={(id, open) => (log = [...log.slice(-3), `${id}:${open ? 'open' : 'closed'}`])}
	items={[
		{ id: 'build', title: 'Build', summary: stage, content: long, open: true },
		{ id: 'test', title: 'Test', summary: stage, content: short },
		{ id: 'deploy', title: 'Deploy', summary: stage, content: short, disabled: true }
	]}
/>
<Text size="xs" tone="muted">onchange → {log.join(', ') || 'nothing yet'}</Text>

<style>
	.steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--sp-1);
	}
</style>
