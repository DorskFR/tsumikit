<script module>
	export const meta = {
		title: 'Sizes and tones',
		caption: 'size default/compact/inline; tone tints the icon chip (neutral falls back to accent).',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Card, EmptyState } from '@dorsk/tsumikit';
</script>

<Card>
	<EmptyState icon="archive" title="Your library is empty" description="Add an artist or album to start building your collection." tone="info" />
</Card>
<Card>
	<EmptyState icon="settings" title="Nothing here yet" description="This section has not been set up." size="compact" />
</Card>
<Card>
	<EmptyState size="inline" title="No results" description="Try a different query." />
</Card>
<Card>
	<EmptyState icon="check" title="All caught up" description="No alerts in the last 24 hours." tone="ok" size="compact" />
</Card>
<Card>
	<EmptyState icon="warning" title="Quota exceeded" description="Uploads resume when space frees up." tone="warn" size="compact" />
</Card>
<Card>
	<EmptyState icon="x-circle" title="Access denied" description="Ask an admin for the viewer role." tone="danger" size="compact" />
</Card>
