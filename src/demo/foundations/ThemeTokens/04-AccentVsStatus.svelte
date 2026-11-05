<script module>
	export const meta = {
		title: 'Accent vs status',
		caption: 'One accent for the primary action, active item and focus; green, amber and red are for status only. The grid scopes each [data-theme] so every palette is compared at once.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Text, theme } from '@dorsk/tsumikit';
</script>

<div class="live">
	<Button variant="primary">Save changes</Button>
	<Badge tone="ok">Deployed</Badge>
	<Badge tone="warn">Degraded</Badge>
	<Badge tone="danger">Failed</Badge>
</div>
<div class="grid">
	{#each theme.all as t (t.id)}
		<div class="theme" data-theme={t.id}>
			<span class="chip accent">Action</span>
			<span class="chip ok">OK</span>
			<span class="chip warn">Warn</span>
			<span class="chip danger">Fail</span>
			<Text size="xs" tone="muted" truncate>{t.label}</Text>
		</div>
	{/each}
</div>

<style>
	.live {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--sp-3);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--sp-2);
	}
	.theme {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--sp-1);
		padding: var(--sp-2);
		border-radius: var(--r-md);
		background: var(--c-bg);
		border: var(--edge-width) solid var(--c-border);
		--txt-fg: var(--c-text-muted);
	}
	.theme :global([data-tsu='Text']) {
		grid-column: 1 / -1;
	}
	.chip {
		display: grid;
		place-items: center;
		height: var(--chip-md);
		border-radius: var(--r-sm);
		font-size: var(--fs-2xs);
		font-weight: var(--fw-semibold);
		color: var(--c-bg);
	}
	.accent {
		background: var(--c-accent);
		color: var(--c-accent-ink);
	}
	.ok {
		background: var(--c-green);
	}
	.warn {
		background: var(--c-amber);
	}
	.danger {
		background: var(--c-red);
	}
</style>
