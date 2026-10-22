<script module>
	export const meta = {
		title: 'Sizes and tones',
		caption: 'size="sm" | "md" | "lg"; tone forces a colour, toneAt derives it from the percentage; the default format is a percentage.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Meter } from '@dorsk/tsumikit';

	const tones = ['neutral', 'accent', 'info', 'ok', 'warn', 'danger'] as const;
</script>

<div class="meters">
	<Meter label="Small" value={35} size="sm" />
	<Meter label="Medium" value={55} />
	<Meter label="Large" value={75} size="lg" />
	{#each tones as tone (tone)}
		<Meter label="tone {tone}" value={60} {tone} size="sm" />
	{/each}
	<Meter label="toneAt 50 / 80 at 45" value={45} toneAt={{ warn: 50, danger: 80 }} size="sm" />
	<Meter label="toneAt 50 / 80 at 65" value={65} toneAt={{ warn: 50, danger: 80 }} size="sm" />
	<Meter label="toneAt 50 / 80 at 92" value={92} toneAt={{ warn: 50, danger: 80 }} size="sm" />
</div>

<style>
	.meters {
		display: grid;
		gap: var(--sp-3);
		max-width: 28rem;
	}
</style>
