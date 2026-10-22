<script module>
	export const meta = {
		title: 'Control rows and nested popover',
		caption: 'control snippet rows host a native select or a nested Popover; their first focusable joins ↑/↓ navigation.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Checkbox, Icon, Menu, Popover, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	let groupBy = $state('repo');
	let labels = $state({ urgent: true, review: false });

	const items: MenuItem[] = [
		{ label: 'View session', icon: 'eye', onselect: () => toasts.show('View') },
		{ label: 'Group by', icon: 'layout-grid', control: groupRow },
		{ label: 'Filter by label', icon: 'tag', control: labelRow },
		{ label: 'Select multiple', icon: 'check-circle', onselect: () => toasts.show('Select multiple') }
	];
</script>

{#snippet groupRow(item: MenuItem)}
	<span class="row">
		<span>{item.label}</span>
		<select class="ghost" aria-label={item.label} bind:value={groupBy}>
			<option value="none">none</option>
			<option value="repo">repo</option>
			<option value="state">state</option>
		</select>
	</span>
{/snippet}

{#snippet labelRow(item: MenuItem)}
	<Popover label={item.label} placement="bottom-start" bare>
		{#snippet trigger()}<span class="row">{item.label}<Icon name="chevron-right" size={14} /></span>{/snippet}
		<div class="labels">
			<Checkbox label="urgent" bind:checked={labels.urgent} />
			<Checkbox label="review" bind:checked={labels.review} />
		</div>
	</Popover>
{/snippet}

<Menu label="Session list" {items} variant="default" size="sm" panelStyle="min-width: 14rem">
	{#snippet trigger()}Sessions <Icon name="chevron-down" size={14} />{/snippet}
</Menu>
<Text size="sm" tone="muted">grouped by {groupBy} · labels: {Object.entries(labels).filter(([, on]) => on).map(([k]) => k).join(', ') || 'none'}</Text>

<style>
	.row {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
	}
	.ghost {
		border: 0;
		background: transparent;
		color: var(--text-muted);
		font: inherit;
	}
	.labels {
		display: grid;
		gap: var(--sp-2);
		padding: var(--sp-2);
	}
</style>
