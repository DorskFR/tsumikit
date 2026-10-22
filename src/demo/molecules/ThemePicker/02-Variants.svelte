<script module>
	export const meta = {
		title: 'Boxes and trigger chrome',
		caption: 'box xs/sm/md/lg sizes the square; variant/tone/pill/control pass to the Popover trigger; placement picks the corner.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, ThemePicker } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<ThemePicker box="xs" />
	<ThemePicker box="sm" />
	<ThemePicker box="md" />
	<ThemePicker box="lg" />
</Cluster>
<Cluster align="center">
	<ThemePicker variant="default" />
	<ThemePicker variant="primary" />
	<ThemePicker variant="default" pill />
	<ThemePicker variant="default" tone="accent" control />
	<ThemePicker placement="bottom-start" />
</Cluster>
