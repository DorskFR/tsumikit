<script module>
	export const meta = {
		title: 'Liquid and stripes',
		caption: 'variant liquid flows two soft pulses through an indeterminate track; variant stripes drifts a diagonal shimmer over the determinate fill. Both honour tone.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Progress } from '@dorsk/tsumikit';
	import { visibleInterval } from '../../fixtures';

	let value = $state(62);

	const tick = () => (value = value >= 100 ? 0 : Math.min(100, value + 6 + Math.random() * 8));
</script>

<Progress variant="liquid" label="Importing wallet" />
<Progress variant="liquid" tone="info" size="sm" label="Scanning" />
<Progress variant="stripes" value={Math.round(value)} label="Unpacking archive" showValue {@attach visibleInterval(tick, 700)} />
<Progress variant="stripes" tone="success" value={40} label="Verified" />
<Progress variant="stripes" indeterminate label="Unpacking, size unknown" />
