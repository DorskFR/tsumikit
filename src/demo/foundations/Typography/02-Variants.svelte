<script module>
	export const meta = {
		title: 'Text variants',
		caption: 'variant body, label, caption, code and eyebrow bundle size, weight, family and casing for their role.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Text } from '@dorsk/tsumikit';
</script>

<Text variant="eyebrow">Deployment</Text>
<Text variant="body">Body is the default reading text, used for paragraphs, descriptions and chat.</Text>
<Text variant="label">Label sits above a control or names a key in a key-value row.</Text>
<Text variant="caption">Caption is the small meta text under a control or beside a timestamp.</Text>
<Text variant="code">pnpm add @dorsk/tsumikit</Text>
