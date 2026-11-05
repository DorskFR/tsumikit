<script module>
	export const meta = {
		title: 'Measure',
		caption: 'measure caps a paragraph at --measure (68ch); a string such as "40ch" sets its own cap.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Text } from '@dorsk/tsumikit';

	const body =
		'A paragraph that is allowed to run the full width of a wide pane becomes hard to follow, because the eye has to find the start of the next line from far away. Capping the measure keeps the return short enough to read without effort.';
</script>

<Text as="p" measure>{body}</Text>
<Text as="p" measure="40ch" tone="muted">{body}</Text>
