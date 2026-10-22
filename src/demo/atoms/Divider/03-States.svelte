<script module>
	export const meta = {
		title: 'Vertical rules and long labels',
		caption: 'orientation="vertical" stretches to the row height; decorative hides it from assistive tech; a long label still centres and wraps.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Divider, Text } from '@dorsk/tsumikit';
</script>

<Cluster gap="var(--sp-3)" align="stretch">
	<Text size="sm">12 open</Text>
	<Divider orientation="vertical" decorative />
	<Text size="sm">3 blocked</Text>
	<Divider orientation="vertical" tone="strong" />
	<Text size="sm">
		Two lines<br />of text
	</Text>
	<Divider orientation="vertical" tone="faint" />
	<Text size="sm" tone="muted">tall row</Text>
</Cluster>
<div style="max-width: 20rem">
	<Divider>Conversation archived on 21 October after 90 days of inactivity</Divider>
</div>
