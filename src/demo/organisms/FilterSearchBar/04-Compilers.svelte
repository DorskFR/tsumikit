<script module>
	export const meta = {
		title: 'One query, three outputs',
		caption: 'onchange(query, raw) fires the AST on every edit; serialize normalises it, toSql compiles it, compilePredicate runs it, filters lists the leaves.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { compilePredicate, filters, FilterSearchBar, KeyValue, serialize, toSql, type Query } from '@dorsk/tsumikit';
	import { fleetSchema, services } from './data';

	let value = $state('role in (worker, cache) OR cpu>=60');
	let query = $state<Query>({ root: null });

	const rows = $derived([
		{ label: 'Normalised', mono: true, value: serialize(query) || '∅' },
		{ label: 'Filters', mono: true, value: filters(query).map((f) => `${f.field} ${f.op}`).join(', ') || '∅' },
		{ label: 'Matches', mono: true, value: services.filter(compilePredicate(query)).map((s) => s.name).join(', ') || 'none' },
		{ label: 'SQL', mono: true, value: toSql(query, 'services').replace('\n', ' ') },
	]);
</script>

<FilterSearchBar
	schema={fleetSchema}
	bind:value
	onchange={(q) => (query = q)}
/>
<KeyValue {rows} dense />
