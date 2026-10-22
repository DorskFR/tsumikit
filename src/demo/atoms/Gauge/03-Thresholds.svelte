<script module>
	export const meta = {
		title: 'Thresholds, forced tones and corners',
		caption: 'warnAt / dangerAt move the colour steps; tone pins the colour; corner slots an emoji or icon; as="button" or "a" makes it interactive.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Gauge, Text, toasts } from '@dorsk/tsumikit';

	let value = $state(50);
	$effect(() => {
		const t = setInterval(() => (value = (value + 7) % 101), 900);
		return () => clearInterval(t);
	});
</script>

<Cluster gap="var(--sp-4)" align="flex-end">
	<span class="cell"><Gauge {value} label="Default thresholds" /><Text size="xs" tone="muted">70 / 90</Text></span>
	<span class="cell"><Gauge {value} warnAt={40} dangerAt={60} label="Strict thresholds" /><Text size="xs" tone="muted">40 / 60</Text></span>
	<span class="cell"><Gauge {value} warnAt={101} label="Never warns" /><Text size="xs" tone="muted">no steps</Text></span>
	<span class="cell"><Gauge {value} tone="ok" label="Forced ok" /><Text size="xs" tone="muted">tone="ok"</Text></span>
	<span class="cell"><Gauge {value} tone="danger" variant="segments" label="Forced danger" /><Text size="xs" tone="muted">tone="danger"</Text></span>
	<Text size="sm" numeric tone="muted">{value}%</Text>
</Cluster>
<Cluster gap="var(--sp-4)">
	<Gauge value={60} tone="ok" label="Battery saver on">{#snippet corner()}🍃{/snippet}</Gauge>
	<Gauge value={92} variant="segments" as="button" label="Hot pace, click for details" onclick={() => toasts.show('92% of the weekly budget used')}>{#snippet corner()}🔥{/snippet}</Gauge>
	<Gauge value={48} as="a" href="#gauge" label="Open usage details" />
</Cluster>

<style>
	.cell {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
