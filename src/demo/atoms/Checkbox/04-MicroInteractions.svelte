<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-check on <html> or any ancestor picks the effect: draw (default), pop, confetti, morph (the tick folds into the mixed dash) or none. Click to replay.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Checkbox } from '@dorsk/tsumikit';

	const variants = ['draw', 'pop', 'confetti', 'morph', 'none'];
	let mixed = $state(true);
</script>

{#each variants as v (v)}
	<div class="fx" data-fx-check={v}>
		<code>{v}</code>
		<Checkbox label="Off" />
		<Checkbox checked label="On" />
		<Checkbox
			label={mixed ? 'Mixed' : 'All'}
			indeterminate={mixed}
			checked={!mixed}
			onchange={(e) => {
				mixed = !mixed;
				e.currentTarget.checked = !mixed;
			}}
		/>
	</div>
{/each}

<style>
	.fx {
		display: grid;
		gap: var(--sp-2);
		justify-items: start;
	}
	code {
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
</style>
