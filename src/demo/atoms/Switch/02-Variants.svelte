<script module>
	export const meta = {
		title: 'Sizes and visible labels',
		caption: 'size sm/md/lg; labelVisible renders the accessible label beside the track.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Switch } from '@dorsk/tsumikit';
</script>

<Cluster gap="var(--sp-4)">
	<Switch size="sm" checked label="Small" labelVisible />
	<Switch size="md" checked label="Medium" labelVisible />
	<Switch size="lg" checked label="Large" labelVisible />
</Cluster>
<Cluster gap="var(--sp-4)">
	<Switch label="Dark mode" />
	<Switch checked label="Dark mode" />
	<Switch checked label="Silent" labelVisible sound={false} />
</Cluster>
