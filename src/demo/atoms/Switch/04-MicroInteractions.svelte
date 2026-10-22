<script module>
	export const meta = {
		title: 'Micro-interactions',
		caption: 'data-fx-switch on <html> or any ancestor picks the effect: squash (default), glow, calm or none.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Switch } from '@dorsk/tsumikit';

	const variants = ['squash', 'glow', 'calm', 'none'];
</script>

{#each variants as v (v)}
	<div class="fx" data-fx-switch={v}>
		<code>{v}</code>
		<Switch label="Off" labelVisible />
		<Switch checked label="On" labelVisible />
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
