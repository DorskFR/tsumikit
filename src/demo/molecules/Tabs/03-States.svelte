<script module>
	export const meta = {
		title: 'States',
		caption: 'a disabled tab is skipped by ←/→; long labels truncate at --tab-max-width and the strip scrolls when it overflows.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Tabs, Text, type TabItem } from '@dorsk/tsumikit';

	const withDisabled: TabItem[] = [
		{ id: 'general', label: 'General' },
		{ id: 'billing', label: 'Billing', disabled: true, count: 'locked' },
		{ id: 'members', label: 'Members', count: 12 }
	];
	const many: TabItem[] = Array.from({ length: 14 }, (_, i) => ({
		id: `q${i + 1}`,
		label: `Query ${i + 1}: select * from sessions where created_at > now() - interval '${i + 1} day'`,
		title: `Query ${i + 1}`
	}));
	let a = $state<string | undefined>('general');
	let b = $state<string | undefined>('q3');
</script>

<Tabs tabs={withDisabled} bind:value={a} label="Workspace settings">
	{#snippet panel(id)}<Text size="sm" tone="muted">{id}</Text>{/snippet}
</Tabs>
<Tabs tabs={many} bind:value={b} label="Saved queries" style="--tab-max-width: 10rem" />
