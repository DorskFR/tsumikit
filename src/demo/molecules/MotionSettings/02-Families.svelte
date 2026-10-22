<script module>
	export const meta = {
		title: 'Families and state',
		caption: 'families restricts and orders the rows; fx.settings is the live state, fx.reset() restores the defaults.',
		layout: 'stack',
	};
</script>

<script lang="ts">
	import { Button, Cluster, FX, FX_FAMILIES, fx, KeyValue, MotionSettings } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<MotionSettings size="sm" families={['check', 'radio', 'switch']} label="Choice motion" />
	<MotionSettings size="md" variant="primary" />
	<Button size="sm" variant="ghost" disabled={fx.isDefault} onclick={() => fx.reset()}>Reset all</Button>
</Cluster>
<KeyValue dense rows={FX_FAMILIES.map((f) => ({ label: FX[f].label, value: `data-fx-${f}="${fx.settings[f]}"`, mono: true }))} />
