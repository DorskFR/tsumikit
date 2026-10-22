<script module>
	export const meta = {
		title: 'States',
		caption: 'readonly over its cap, uncapped (cap={null}, clearAtMax, uncappedLabel), the caption snippet, custom step and min/max, and the 0% / 100% edges.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CapBar } from '@dorsk/tsumikit';

	let uncapped = $state<number | null>(null);
	let live = $state<number | null>(80);
	let zero = $state<number | null>(0);
	let full = $state<number | null>(100);
	let tokens = $state<number | null>(600);
</script>

<div class="rows">
	<CapBar label="Locked" value={95} cap={80} hint="over cap" readonly />
	<CapBar label="Gemini" value={44} bind:cap={uncapped} hint="uncapped" clearAtMax uncappedLabel="no cap" capLabel="Gemini limit" />
	<CapBar label="Anthropic" value={62} bind:cap={live} hint="resets 3h">
		{#snippet caption()}▲ using 62% · cap {live ?? 'none'}%{/snippet}
	</CapBar>
	<CapBar label="Tokens" value={420} bind:cap={tokens} min={0} max={1000} step={50} warnAt={80} capValueText={(c) => (c === null ? 'no cap' : `${c}k tokens`)} />
	<CapBar label="Cap at 0%" value={0} bind:cap={zero} />
	<CapBar label="Cap at 100%" value={100} bind:cap={full} />
</div>

<style>
	.rows {
		display: grid;
		gap: var(--sp-3);
	}
</style>
