<script module>
	export const meta = {
		title: 'Boxes and trigger chrome',
		caption: 'box xs/sm/md/lg; variant/tone/pill/control pass to the Popover trigger; placement picks the corner.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, FontScalePicker } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<FontScalePicker box="xs" />
	<FontScalePicker box="sm" />
	<FontScalePicker box="md" />
	<FontScalePicker box="lg" />
</Cluster>
<Cluster align="center">
	<FontScalePicker variant="default" />
	<FontScalePicker variant="primary" />
	<FontScalePicker variant="default" pill />
	<FontScalePicker variant="default" tone="info" control />
	<FontScalePicker placement="bottom-start" />
</Cluster>
