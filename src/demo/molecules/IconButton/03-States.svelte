<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, loading, spin for a refresh in flight, count with countMax, href renders a link, hitArea="compact" in a dense row, shrink={false} in a squeezed row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, IconButton } from '@dorsk/tsumikit';

	let refreshing = $state(false);
	function refresh() {
		refreshing = true;
		setTimeout(() => (refreshing = false), 1500);
	}
</script>

<Cluster align="center">
	<IconButton icon="trash" label="Delete" disabled variant="default" />
	<IconButton icon="upload" label="Uploading" loading variant="primary" />
	<IconButton icon="retry" label="Refresh" spin={refreshing} variant="default" onclick={refresh} />
	<IconButton icon="bell" label="Notifications" count={3} variant="default" />
	<IconButton icon="mail" label="Inbox" count={1500} countMax={999} variant="default" />
	<IconButton icon="external" label="Open on GitHub" href="https://github.com/DorskFR/tsumikit" variant="default" />
</Cluster>
<Cluster gap="0" align="center">
	<IconButton icon="arrow-up" label="Move up" hitArea="compact" size={14} />
	<IconButton icon="arrow-down" label="Move down" hitArea="compact" size={14} />
	<IconButton icon="x" label="Remove" hitArea="compact" size={14} hoverDanger />
</Cluster>
<div class="squeeze">
	<span class="filler"></span>
	<IconButton icon="settings" label="Pinned" shrink={false} variant="default" />
</div>

<style>
	.squeeze {
		display: flex;
		gap: var(--sp-2);
		max-width: 10rem;
	}
	.filler {
		flex: 1 1 20rem;
		height: 2.25rem;
		border-radius: var(--r-sm);
		background: var(--bg-elevated);
	}
</style>
