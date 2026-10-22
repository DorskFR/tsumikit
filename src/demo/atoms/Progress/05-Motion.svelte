<script module>
	export const meta = {
		title: 'Liquid and stripes',
		caption: 'variant liquid flows two soft pulses through an indeterminate track; variant stripes drifts a diagonal shimmer over the determinate fill. Both honour tone.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Progress } from '@dorsk/tsumikit';

	let value = $state(62);

	onMount(() => {
		const tick = setInterval(() => {
			value = value >= 100 ? 0 : Math.min(100, value + 6 + Math.random() * 8);
		}, 700);
		return () => clearInterval(tick);
	});
</script>

<Progress variant="liquid" label="Importing wallet" />
<Progress variant="liquid" tone="info" size="sm" label="Scanning" />
<Progress variant="stripes" value={Math.round(value)} label="Unpacking archive" showValue />
<Progress variant="stripes" tone="success" value={40} label="Verified" />
<Progress variant="stripes" indeterminate label="Unpacking, size unknown" />
