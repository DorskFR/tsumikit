<script module>
	export const meta = {
		title: 'Tones, dashed and padding',
		caption: 'tone="accent" | "neutral" | "strong"; dashed={false} for a solid frame; padding sm, md, lg; legend can be a snippet.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Badge, Fieldset, Text } from '@dorsk/tsumikit';
</script>

<Fieldset legend="Accent, dashed"><Text size="sm" tone="muted">Default frame for a droppable pool.</Text></Fieldset>
<Fieldset legend="Neutral" tone="neutral"><Text size="sm" tone="muted">Quiet grouping inside a form.</Text></Fieldset>
<Fieldset legend="Strong" tone="strong"><Text size="sm" tone="muted">Draws the eye to an empty target.</Text></Fieldset>
<Fieldset legend="Solid" dashed={false}><Text size="sm" tone="muted">dashed={'{false}'}</Text></Fieldset>
<Fieldset legend="Small padding" padding="sm"><Text size="sm" tone="muted">padding="sm"</Text></Fieldset>
<Fieldset legend="Large padding" padding="lg"><Text size="sm" tone="muted">padding="lg"</Text></Fieldset>
<Fieldset>
	{#snippet legend()}
		<span class="legend">Billing <Badge tone="warn" size="sm">Past due</Badge></span>
	{/snippet}
	<Text size="sm" tone="muted">A snippet legend carries a Badge beside the text.</Text>
</Fieldset>

<style>
	.legend {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
</style>
