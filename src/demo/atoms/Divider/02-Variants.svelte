<script module>
	export const meta = {
		title: 'Tones, spacing and labels',
		caption: 'tone default, strong or faint; spacing sets the margin along the axis; children centre a label in the rule.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Divider, Text } from '@dorsk/tsumikit';
</script>

<Text size="sm">Above the default rule</Text>
<Divider />
<Text size="sm">Between default and strong</Text>
<Divider tone="strong" />
<Text size="sm">Between strong and faint</Text>
<Divider tone="faint" />
<Text size="sm">Tight spacing below</Text>
<Divider spacing="var(--sp-1)" />
<Text size="sm">Wide spacing below</Text>
<Divider spacing="var(--sp-6)" />
<Divider>3 older messages</Divider>
<Divider tone="strong">Today</Divider>
