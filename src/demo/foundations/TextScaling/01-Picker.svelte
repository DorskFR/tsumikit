<script module>
	export const meta = {
		title: 'Reading view with a size control',
		caption: 'FontScalePicker writes --fs-scale on the root; this Prose-like block follows it while the toolbar buttons keep their height.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, FontScalePicker, Heading, Text } from '@dorsk/tsumikit';
</script>

<Cluster justify="space-between">
	<Cluster gap="var(--sp-1)">
		<Button size="sm" variant="ghost">Back</Button>
		<Button size="sm" variant="ghost">Share</Button>
	</Cluster>
	<FontScalePicker />
</Cluster>
<Heading level={3}>Why rem and not px</Heading>
<Text as="p" measure="60ch">
	The kit never resets the root font size, so browser zoom and the OS text-size setting are respected out of the box. Most apps should stop there. Reading-dense screens such as chat and docs can additionally offer this control to grow body text without enlarging every button and sidebar.
</Text>
