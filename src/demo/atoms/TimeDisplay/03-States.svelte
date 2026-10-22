<script module>
	export const meta = {
		title: 'Live, unknown and edge durations',
		caption: 'duration null or Infinity = live (position only, no toggle); zero, a position past the end, hours-long media and a hidden-numbers check.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Dot, Text, TimeDisplay } from '@dorsk/tsumikit';

	let live = $state(3671);
	$effect(() => {
		const t = setInterval(() => live++, 1000);
		return () => clearInterval(t);
	});
</script>

<Cluster gap="var(--sp-4)">
	<span class="cell"><Cluster gap="var(--sp-1)"><Dot color="var(--danger)" glow label="Live" /><TimeDisplay current={live} /></Cluster><Text size="xs" tone="muted">live</Text></span>
	<span class="cell"><TimeDisplay current={12} duration={Infinity} /><Text size="xs" tone="muted">Infinity</Text></span>
	<span class="cell"><TimeDisplay current={0} duration={0} /><Text size="xs" tone="muted">empty</Text></span>
	<span class="cell"><TimeDisplay current={999} duration={120} /><Text size="xs" tone="muted">past the end</Text></span>
	<span class="cell"><TimeDisplay current={5025} duration={36_000} /><Text size="xs" tone="muted">hours</Text></span>
	<span class="cell"><TimeDisplay current={5025} duration={36_000} remaining /><Text size="xs" tone="muted">hours left</Text></span>
</Cluster>

<style>
	.cell {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
