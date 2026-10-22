<script module>
	export const meta = {
		title: 'Sizes, shapes and widths',
		caption: 'size sm/md/lg, shape="pill", mono, width pins a fixed width, grow fills the row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Input } from '@dorsk/tsumikit';
</script>

<Cluster>
	<Input size="sm" placeholder="Small" aria-label="Small" />
	<Input size="md" placeholder="Medium" aria-label="Medium" />
	<Input size="lg" placeholder="Large" aria-label="Large" />
</Cluster>
<Cluster>
	<Input shape="pill" icon="search" placeholder="Search tracks" aria-label="Search tracks" />
	<Input mono value="sk-live-4f9c…" aria-label="API key" readonly />
	<Input width="5rem" value="8080" inputmode="numeric" aria-label="Port" />
</Cluster>
<Cluster wrap={false}>
	<Input grow placeholder="Invite by email" aria-label="Invite by email" />
	<Button variant="primary" control>Invite</Button>
</Cluster>
