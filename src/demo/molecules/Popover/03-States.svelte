<script module>
	export const meta = {
		title: 'Hover, link trigger, disabled and bound open',
		caption: 'openOn="hover" adds pointer opening on fine pointers; as="a" href navigates and reveals; disabled; bind:open drives it from outside.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Icon, Popover, Text } from '@dorsk/tsumikit';
	import { services } from '../../fixtures';

	const svc = services[1];
	let open = $state(false);
</script>

<Cluster align="center">
	<Popover label="Worker details" openOn="hover" variant="default" size="sm">
		{#snippet trigger()}<Icon name="zap" size={14} /> {svc.name}{/snippet}
		<dl class="kv">
			<dt>region</dt><dd>{svc.region}</dd>
			<dt>cpu</dt><dd>{svc.cpu}%</dd>
			<dt>memory</dt><dd>{svc.memoryMb} MB</dd>
			<dt>uptime</dt><dd>{svc.uptimeDays} d</dd>
		</dl>
	</Popover>
	<Popover label="Runbook" openOn="hover" as="a" href="#popover" bare>
		{#snippet trigger()}<Text tone="accent" size="sm">Runbook: worker saturation</Text>{/snippet}
		<div class="note"><Text size="sm">Click follows the link; hovering previews the first steps: drain the queue, scale to 3, page on-call.</Text></div>
	</Popover>
	<Popover label="Unavailable" variant="default" size="sm" disabled>
		{#snippet trigger()}Disabled{/snippet}
		<div class="note"><Text size="sm">Never shown.</Text></div>
	</Popover>
</Cluster>
<Cluster align="center">
	<Popover label="Deploy summary" variant="default" size="sm" bind:open>
		{#snippet trigger()}Summary{/snippet}
		<div class="note"><Text size="sm">3 services, 1 warning. Opened from the button beside me.</Text></div>
	</Popover>
	<Button size="sm" variant="ghost" onclick={() => (open = !open)}>{open ? 'Close' : 'Open'} from outside</Button>
</Cluster>

<style>
	.kv {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--sp-1) var(--sp-3);
		margin: 0;
		padding: var(--sp-2) var(--sp-3);
		font-size: var(--fs-sm);
	}
	dt {
		color: var(--text-muted);
	}
	dd {
		margin: 0;
		font-family: var(--font-mono);
	}
	.note {
		max-width: 16rem;
		padding: var(--sp-2) var(--sp-3);
	}
</style>
