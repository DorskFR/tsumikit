<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, loading, pressed, a corner count (hidden at 0, capped by countMax) and a block button that fills its row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster } from '@dorsk/tsumikit';

	let starred = $state(false);
</script>

<Cluster>
	<Button disabled>Disabled</Button>
	<Button variant="primary" loading>Deploying</Button>
	<Button pressed={starred} onclick={() => (starred = !starred)}>{starred ? 'Starred' : 'Star'}</Button>
	<Button count={3}>Inbox</Button>
	<Button variant="primary" count={12}>Apply filters</Button>
	<Button variant="danger" count={120}>Failed jobs</Button>
	<Button tone="warn" count={1500} countMax={999}>Queued</Button>
	<Button count={0}>Zero hides</Button>
</Cluster>
<Button block variant="primary">Continue to checkout</Button>
<Cluster>
	<Button>A label long enough to show how a button behaves when its text wraps onto a second line</Button>
	<Button shrink={false}>No shrink</Button>
</Cluster>
