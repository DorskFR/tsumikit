<script module>
	export const meta = {
		title: 'StatTile alias',
		caption: 'StatTile is the same component exported under a dashboard-friendly name; every prop is identical.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, StatTile } from '@dorsk/tsumikit';
</script>

<AutoGrid min="180px">
	<StatTile label="Active users" value="3,412" sub="last 15 min" icon="users" tone="accent" />
	<StatTile label="Signups" value={87} unit="today" sub="+12 vs yesterday" icon="plus" tone="ok" />
	<StatTile label="Churned" value={3} unit="this week" icon="log-out" tone="danger" tintValue />
</AutoGrid>
