<script module>
	export const meta = {
		title: 'Sizes, mono and rows',
		caption: 'size sm/md/lg sets the type scale, rows the initial height, mono the family; block fills the width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Textarea } from '@dorsk/tsumikit';
</script>

<Cluster align="flex-start">
	<Textarea size="sm" rows={2} placeholder="Small" aria-label="Small" />
	<Textarea size="md" rows={2} placeholder="Medium" aria-label="Medium" />
	<Textarea size="lg" rows={2} placeholder="Large" aria-label="Large" />
</Cluster>
<Textarea
	mono
	block
	rows={4}
	value={'[server]\nhost = 0.0.0.0\nport = 8080\nlog_level = "info"'}
	aria-label="Config"
/>
