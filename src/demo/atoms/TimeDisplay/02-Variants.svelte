<script module>
	export const meta = {
		title: 'Sizes, remaining and formats',
		caption: 'size sm/md; remaining starts on the countdown; toggle={false} renders a static span; formatTime swaps the formatter.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Text, TimeDisplay } from '@dorsk/tsumikit';

	const hhmmss = (s: number) => {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = Math.floor(s % 60);
		return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	};
</script>

<Cluster gap="var(--sp-4)">
	<span class="cell"><TimeDisplay current={62} duration={1425} size="sm" /><Text size="xs" tone="muted">sm</Text></span>
	<span class="cell"><TimeDisplay current={62} duration={1425} size="md" /><Text size="xs" tone="muted">md</Text></span>
	<span class="cell"><TimeDisplay current={62} duration={1425} remaining /><Text size="xs" tone="muted">remaining</Text></span>
	<span class="cell"><TimeDisplay current={62} duration={1425} toggle={false} /><Text size="xs" tone="muted">static</Text></span>
	<span class="cell"><TimeDisplay current={5025} duration={7384} formatTime={hhmmss} /><Text size="xs" tone="muted">custom format</Text></span>
</Cluster>

<style>
	.cell {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
