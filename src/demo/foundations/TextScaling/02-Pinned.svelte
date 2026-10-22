<script module>
	export const meta = {
		title: 'Scaled versus pinned text',
		caption: 'scale={false} opts a Text out of --fs-scale; change the size in the toolbar to see only the first line move.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Text } from '@dorsk/tsumikit';
</script>

<Text size="lg">Follows --fs-scale with the picker</Text>
<Text size="lg" scale={false}>Pinned at its token size (scale={'{false}'})</Text>
<Text size="sm" tone="muted">Chrome such as badges, keyboard hints and timestamps is pinned by default inside components.</Text>
