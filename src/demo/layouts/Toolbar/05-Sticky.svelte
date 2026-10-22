<script module>
	export const meta = {
		title: 'Sticky over a scrolling list',
		caption: 'sticky pins the bar at stickyOffset while the list scrolls under it.',
		layout: 'frame',
		height: '16rem'
	};
</script>

<script lang="ts">
	import { Badge, Button, Stack, Text, Toolbar } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';
</script>

<Toolbar label="Bulk actions" sticky density="compact" style="padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border)">
	<Text size="sm" weight="semibold">{services.length * 3} services</Text>
	<Button size="sm" style="margin-inline-start: auto">Restart</Button>
	<Button size="sm" variant="danger">Drain</Button>
</Toolbar>
<Stack gap="0" as="ul" style="list-style: none; margin: 0; padding: 0">
	{#each [...services, ...services, ...services] as service, i (i)}
		<li style="display: flex; justify-content: space-between; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border)">
			<Text mono size="sm" truncate>{service.name}</Text>
			<Badge tone={service.status} size="xs">{service.region}</Badge>
		</li>
	{/each}
</Stack>
