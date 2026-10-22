<script module>
	export const meta = {
		title: 'Variants, chips, boxes and labels',
		caption: 'variant ghost (default), default, primary, danger; chip with tone for toolbar squares; box xs, sm, md, lg; emoji and glyphSize; showLabel and showLabel="row".',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, IconButton } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<IconButton icon="search" label="Search" />
	<IconButton icon="edit" label="Edit" variant="default" />
	<IconButton icon="star" label="Star" variant="primary" />
	<IconButton icon="trash" label="Delete" variant="danger" />
	<IconButton icon="x" label="Remove" inline />
	<IconButton icon="trash" label="Remove" inline hoverDanger />
	<IconButton icon="star" label="Starred" pill variant="default" pressed />
</Cluster>
<Cluster align="center">
	<IconButton icon="chevron-left" label="Back" chip variant="default" />
	<IconButton icon="star" label="Pin" chip variant="default" tone="accent" />
	<IconButton icon="bell" label="Snooze" chip variant="default" tone="warn" />
	<IconButton icon="check" label="Resolve" chip variant="default" tone="success" />
	<IconButton icon="trash" label="Interrupt" chip variant="default" tone="danger" hoverDanger />
</Cluster>
<Cluster align="center">
	<IconButton icon="x" label="Remove" box="xs" variant="default" />
	<IconButton icon="search" label="Search" box="sm" variant="default" />
	<IconButton icon="edit" label="Edit" box="md" variant="default" />
	<IconButton icon="star" label="Star" box="lg" variant="default" />
	<IconButton emoji="←" label="Back" box="lg" glyphSize="1.5rem" variant="default" />
	<IconButton emoji="🔔" label="Notifications" variant="default" />
</Cluster>
<Cluster align="center">
	<IconButton icon="download" label="Download" showLabel variant="default" />
	<IconButton icon="share" label="Share" showLabel />
	<div class="menu">
		<IconButton icon="settings" label="Settings" showLabel="row" />
		<IconButton icon="log-out" label="Sign out" showLabel="row" hoverDanger />
	</div>
</Cluster>

<style>
	.menu {
		display: grid;
		gap: var(--sp-0-5);
		width: 10rem;
	}
</style>
