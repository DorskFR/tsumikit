<script module>
	export const meta = {
		title: 'Tone × size matrix',
		caption: 'Regression fixture: every tone at every size, flat and gradient.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Progress } from '@dorsk/tsumikit';

	const tones = ['accent', 'success', 'info', 'warn', 'danger', 'neutral'] as const;
	const sizes = ['sm', 'md', 'lg'] as const;
</script>

{#each sizes as size (size)}
	<div class="grid">
		{#each tones as tone (tone)}
			<Progress value={60} {tone} {size} label="{tone} {size}" />
		{/each}
	</div>
{/each}
<div class="grid">
	{#each tones as tone (tone)}
		<Progress value={60} {tone} gradient striped label="{tone} gradient striped" />
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: var(--sp-3);
		align-items: center;
	}
</style>
