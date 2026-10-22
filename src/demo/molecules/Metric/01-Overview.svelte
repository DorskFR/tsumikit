<script module>
	export const meta = {
		title: 'KPI row',
		caption: 'label, value, unit, sub and icon on each tile; tone tints the chip, tintValue the number too; AutoGrid wraps the row on a phone.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, Metric } from '@dorsk/tsumikit';
</script>

<AutoGrid min="180px">
	<Metric label="Requests" value="1.28" unit="M" sub="+4.2% vs yesterday" icon="zap" />
	<Metric label="Error rate" value="0.31" unit="%" sub="target < 0.5%" icon="alert-circle" tone="ok" />
	<Metric label="p95 latency" value={412} unit="ms" sub="+38 ms since deploy" icon="clock" tone="warn" tintValue />
	<Metric label="Spend today" value="$184" sub="cap $250 · resets in 6h" icon="flame" tone="danger" />
</AutoGrid>
