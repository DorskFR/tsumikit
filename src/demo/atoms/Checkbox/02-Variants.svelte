<script module>
	export const meta = {
		title: 'Sizes',
		caption: 'size sm/md/lg scales box and label; labelHidden keeps the name for assistive tech only.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Checkbox, Cluster } from '@dorsk/tsumikit';
</script>

<Cluster gap="var(--sp-4)">
	<Checkbox checked size="sm" label="Small" />
	<Checkbox checked size="md" label="Medium" />
	<Checkbox checked size="lg" label="Large" />
</Cluster>
<Cluster gap="var(--sp-4)">
	<Checkbox checked label="Mark as read" labelHidden />
	<Checkbox label="Silent" sound={false} />
</Cluster>
