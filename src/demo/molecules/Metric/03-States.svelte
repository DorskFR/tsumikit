<script module>
	export const meta = {
		title: 'Links, actions, segments and overflow',
		caption: 'href makes the tile a link (external adds an arrow and new tab), onclick a button; segments trail the value with tooltips; long values wrap inside the tile.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, Metric, toasts } from '@dorsk/tsumikit';
</script>

<AutoGrid min="200px">
	<Metric label="Open alerts" value={7} icon="bell" tone="warn" href="#metric" sub="click to view" />
	<Metric label="Status page" value="99.98" unit="%" icon="external" href="https://status.example.com" external />
	<Metric label="Queued jobs" value={312} icon="loader" onclick={() => toasts.show('Queue opened')} sub="click to drain" />
	<Metric
		label="Sessions"
		value={24}
		icon="users"
		segments={[
			{ icon: 'check', value: 18, tone: 'ok', hint: 'finished' },
			{ icon: 'loader', value: 4, tone: 'info', hint: 'running' },
			{ icon: 'x', value: 2, tone: 'danger', hint: 'failed' }
		]}
	/>
	<Metric label="A label long enough to wrap on a narrow tile" value="1,284,311,042" unit="bytes transferred since midnight" sub="sub-lines wrap as well instead of pushing the tile wider" icon="archive" />
	<Metric label="Empty" value="—" sub="no data in range" icon="minus" />
</AutoGrid>
