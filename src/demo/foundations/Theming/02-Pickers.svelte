<script module>
	export const meta = {
		title: 'Pickers and auto mode',
		caption: 'ThemePicker lists theme.all; auto adds a row that follows the system scheme and remembers one light and one dark palette.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text, ThemePicker, theme } from '@dorsk/tsumikit';
</script>

<Cluster>
	<ThemePicker />
	<ThemePicker auto />
	<Text size="sm" tone="muted">mode: <Text mono>{theme.mode}</Text> · resolved: <Text mono>{theme.resolved}</Text></Text>
</Cluster>
