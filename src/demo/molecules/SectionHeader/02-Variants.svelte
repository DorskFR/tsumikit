<script module>
	export const meta = {
		title: 'Sizes, tones and the group variant',
		caption: 'size from xs to 2xl, icon with tone, uppercase with a hue swatch, and variant="group" with a lead snippet and a rule to the actions.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Icon, SectionHeader } from '@dorsk/tsumikit';
</script>

<SectionHeader title="Extra small" size="xs" level={3} count={3} />
<SectionHeader title="Small" size="sm" level={3} count={3} />
<SectionHeader title="Medium" size="md" level={3} count={3} />
<SectionHeader title="Large" size="lg" level={3} count={3} />
<SectionHeader title="Extra large" size="xl" level={2} count={3} />
<SectionHeader title="Failed" icon="warning" tone="danger" count={2} level={3} size="sm" />
<SectionHeader title="Healthy" icon="check-circle" tone="ok" count={38} level={3} size="sm" />
<SectionHeader title="Pending" icon="clock" tone="warn" count={5} level={3} size="sm" />
<SectionHeader label="eu-west-1" uppercase hue={210} count={12} level={3} size="xs" />
<SectionHeader variant="group" title="sakura" count={7} level={3} size="sm">
	{#snippet lead()}<Badge tone="ok" dot size="xs" border={false}>live</Badge>{/snippet}
	{#snippet actions()}
		<Button size="sm" variant="ghost">Sort</Button>
		<Button size="sm" variant="ghost" aria-label="Hide group"><Icon name="eye" size={14} /></Button>
	{/snippet}
</SectionHeader>
