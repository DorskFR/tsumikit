<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-radio on <html> or any ancestor picks the effect: spring (default), liquid or none.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { RadioGroup } from '@dorsk/tsumikit';

	const variants = ['spring', 'liquid', 'none'];
	const options = [
		{ value: 'daily', label: 'Daily' },
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'never', label: 'Never' }
	];
	let values = $state<Record<string, string>>({ spring: 'daily', liquid: 'daily', none: 'daily' });
</script>

{#each variants as v (v)}
	<div class="fx" data-fx-radio={v}>
		<code>{v}</code>
		<RadioGroup label="Digest ({v})" {options} bind:value={values[v]} />
	</div>
{/each}

<style>
	.fx {
		display: grid;
		gap: var(--sp-2);
	}
	code {
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
</style>
