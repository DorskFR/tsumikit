<script module>
	export const meta = {
		title: 'Measure',
		caption: 'Lines stop at --measure (68ch) however wide the pane; style="--measure: none" lets the text fill the box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Prose, Text, renderMarkdown } from '@dorsk/tsumikit';

	const source = `Markdown that runs edge to edge on a wide pane is tiring to read: the eye loses the line start on every return. Capping the measure keeps each line between 45 and 75 characters, where reading speed and comprehension are best, while tables, code blocks and images still fill the prose box.`;
</script>

<Text variant="eyebrow">Default</Text>
<Prose html={renderMarkdown(source)} />
<Text variant="eyebrow">--measure: none</Text>
<Prose html={renderMarkdown(source)} style="--measure: none" />
