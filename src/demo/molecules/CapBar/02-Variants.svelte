<script module>
	export const meta = {
		title: 'Size, layout and stacking',
		caption: 'size="lg", layout="stacked" puts the label above the bar, stackBelow stacks only under that container width, labelWidth and readoutWidth align columns.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { CapBar } from '@dorsk/tsumikit';

	let a = $state<number | null>(90);
	let b = $state<number | null>(70);
	let c = $state<number | null>(60);
</script>

<div class="rows">
	<CapBar label="Large" value={81} bind:cap={a} hint="resets 12h" size="lg" />
	<CapBar label="Stacked" value={44} bind:cap={b} hint="label above the bar" layout="stacked" />
	<CapBar label="Auto-stack" value={58} bind:cap={c} hint="stacks under 30rem" stackBelow="30rem" />
	<CapBar label="Wide label column" value={30} cap={50} labelWidth="8rem" readoutWidth="6rem" stackBelow="26rem" />
</div>

<style>
	.rows {
		display: grid;
		gap: var(--sp-3);
	}
</style>
