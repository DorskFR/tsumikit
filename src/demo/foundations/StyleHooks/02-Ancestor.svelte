<script module>
	export const meta = {
		title: 'Hooks from an ancestor rule',
		caption: 'Custom properties inherit: one scoped rule on a wrapper restyles every Button and Badge inside it, no :global() needed.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Badge, Button, Cluster } from '@dorsk/tsumikit';
</script>

<div class="danger-zone">
	<Cluster justify="space-between">
		<Badge>Danger zone</Badge>
		<Cluster>
			<Button size="sm">Rotate keys</Button>
			<Button size="sm">Delete workspace</Button>
		</Cluster>
	</Cluster>
</div>

<style>
	.danger-zone {
		--btn-bg: color-mix(in srgb, var(--danger) 12%, transparent);
		--btn-fg: var(--danger);
		--btn-border: var(--danger);
		--badge-bg: var(--danger);
		--badge-fg: var(--text-on-accent);
		--badge-border: var(--danger);
		padding: var(--sp-3);
		border: 1px dashed var(--danger);
		border-radius: var(--r-md);
	}
</style>
