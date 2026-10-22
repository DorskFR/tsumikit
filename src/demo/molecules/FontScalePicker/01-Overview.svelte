<script module>
	export const meta = {
		title: 'Reader with a text-size control',
		caption: 'the picker in a reading toolbar; body text follows --fs-scale while the toolbar and buttons keep their size.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, FontScalePicker, Heading, Text, Toolbar, fontScale, SCALE_LEVELS } from '@dorsk/tsumikit';

	const level = $derived(SCALE_LEVELS.find((l) => l.id === fontScale.levelId));
</script>

<Toolbar label="Reader" density="compact">
	<Text size="sm" tone="muted">Runbook · worker saturation</Text>
	<span class="spacer"></span>
	<Text size="xs" tone="faint" numeric>{level?.label} · ×{level?.value}</Text>
	<FontScalePicker box="sm" />
	<Button size="sm" variant="ghost">Share</Button>
</Toolbar>
<article class="prose">
	<Heading level={3} size="md">When worker-02 saturates</Heading>
	<Text as="p">Drain the queue first: pause the scheduler so no new jobs land on the hot worker, then let in-flight jobs finish. Only then scale the pool, otherwise the new replicas inherit the backlog and saturate too.</Text>
	<Text as="p">Page the on-call engineer if CPU stays above 85% for more than ten minutes after scaling. The dashboard's warn threshold already reflects this.</Text>
</article>

<style>
	.spacer {
		flex: 1;
	}
	.prose {
		display: grid;
		gap: var(--sp-2);
		max-width: 60ch;
	}
</style>
