<script module>
	export const meta = {
		title: 'The list',
		caption: 'CSS: @media (min-width: 48rem) and (max-width: 47.999rem) only, never px. JS: breakpoints.md is 48, minWidth("md") builds the query and mq.md tracks it live; resize the window to see the dots flip.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, breakpoints, breakpointsPx, maxWidth, minWidth, mq, Text } from '@dorsk/tsumikit';

	const names = Object.keys(breakpoints) as (keyof typeof breakpoints)[];
</script>

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Width</th>
			<th>min-width</th>
			<th>max-width</th>
			<th>mq</th>
		</tr>
	</thead>
	<tbody>
		{#each names as bp (bp)}
			<tr>
				<td><Text mono weight="semibold">{bp}</Text></td>
				<td><Text mono numeric tone="muted">{breakpoints[bp]}rem · {breakpointsPx[bp]}px</Text></td>
				<td><Text mono size="xs">{minWidth(bp)}</Text></td>
				<td><Text mono size="xs">{maxWidth(bp)}</Text></td>
				<td><Badge tone={mq[bp] ? 'ok' : 'neutral'}>{mq[bp] ? 'matches' : 'below'}</Badge></td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: var(--sp-1) var(--sp-3);
		text-align: left;
		border-bottom: 1px solid var(--border);
	}
	th {
		font-size: var(--fs-xs);
		font-weight: var(--fw-medium);
		color: var(--text-muted);
	}
</style>
