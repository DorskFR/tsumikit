<script lang="ts">
	import { Badge, Card, type Column, DataTable, Heading } from '@dorsk/tsumikit';
	import { type PropRow as Prop, propsFor } from './props';
	import type { DemoEntry } from './registry';

	let { entry }: { entry: DemoEntry } = $props();

	const rows = $derived(propsFor(entry));

	const columns: Column<Prop>[] = [
		{ key: 'name', label: 'Prop', role: 'title', nowrap: true },
		{ key: 'type', label: 'Type', role: 'detail' },
		{ key: 'default', label: 'Default', role: 'meta', get: (p) => p.default ?? '' },
		{ key: 'description', label: 'Description', role: 'detail', get: (p) => p.description ?? '' },
	];
</script>

{#snippet nameCell(p: Prop)}
	<span class="props-table__name">
		<code>{p.name}</code>
		{#if !p.optional}<Badge size="xs" tone="warn">required</Badge>{/if}
		{#if p.bindable}<Badge size="xs" tone="info">bindable</Badge>{/if}
	</span>
{/snippet}

{#snippet typeCell(p: Prop)}
	<code class="props-table__type">{p.type}</code>
{/snippet}

{#snippet defaultCell(p: Prop)}
	{#if p.default !== undefined}<code>{p.default}</code>{:else}<span class="props-table__none">—</span>{/if}
{/snippet}

{#if rows}
	<section class="props-table" aria-labelledby="{entry.id}--props">
		<Heading level={3} size="sm" id="{entry.id}--props">Props</Heading>
		<Card padding="none">
			<DataTable
				{rows}
				{columns}
				rowKey={(p) => p.name}
				size="sm"
				responsive="stack"
				cellSnippets={{ name: nameCell, type: typeCell, default: defaultCell }}
				tableClass="props-table__table"
			/>
		</Card>
	</section>
{/if}

<style>
	.props-table {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
	}
	.props-table code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
	.props-table__name {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		flex-wrap: wrap;
	}
	.props-table__type {
		color: var(--text-muted);
		overflow-wrap: anywhere;
	}
	.props-table__none {
		color: var(--text-muted);
	}
	:global(.props-table__table) {
		font-size: var(--fs-sm, 0.875rem);
	}
</style>
