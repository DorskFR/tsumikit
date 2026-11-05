<script module>
	export const meta = {
		title: 'Fast vs slow save',
		caption:
			'loading shows nothing for the first 200 ms and then stays at least 500 ms, so a 60 ms save never flashes a spinner while a 1.5 s one reads as steady work. aria-busy and the click block follow loading at once. loadingDelay / loadingMin tune or disable it (0).',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Button, Text } from '@dorsk/tsumikit';

	let fast = $state(false);
	let slow = $state(false);
	let eager = $state(false);
	let saves = $state(0);

	function save(ms: number, set: (v: boolean) => void) {
		set(true);
		setTimeout(() => {
			set(false);
			saves += 1;
		}, ms);
	}
</script>

<Button variant="primary" loading={fast} onclick={() => save(60, (v) => (fast = v))}>Save (60 ms)</Button>
<Button variant="primary" loading={slow} onclick={() => save(1500, (v) => (slow = v))}>Save (1.5 s)</Button>
<Button loading={eager} loadingDelay={0} loadingMin={0} onclick={() => save(60, (v) => (eager = v))}>Save (60 ms, no delay)</Button>
<Text size="sm" tone="muted">{saves} saved</Text>
