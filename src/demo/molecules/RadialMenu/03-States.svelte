<script module>
	export const meta = {
		title: 'Bound open, disabled petals, custom trigger, corner clamp',
		caption: 'bind:open drives it from outside; disabled items stay visible but inert; a trigger snippet replaces the FAB face; the fan clamps into the viewport.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, RadialMenu, Text, toasts, type MenuItem } from '@dorsk/tsumikit';

	let open = $state(false);
	let picked = $state('nothing');
	const items: MenuItem[] = [
		{ label: 'Screenshot', icon: 'image', onselect: () => (picked = 'screenshot') },
		{ label: 'Record', icon: 'video', disabled: true },
		{ label: 'Pin', icon: 'pin', onselect: () => (picked = 'pin') },
		{ label: 'Delete', icon: 'trash', danger: true, onselect: () => { picked = 'delete'; toasts.error('Deleted'); } }
	];
</script>

<Cluster align="center">
	<RadialMenu label="Capture" {items} bind:open onclose={() => toasts.show(`Picked ${picked}`)} />
	<Button size="sm" onclick={() => (open = !open)}>{open ? 'Close' : 'Open'} from outside</Button>
	<Text size="sm" tone="muted">last: {picked}</Text>
</Cluster>
<div class="corner">
	<RadialMenu label="Quick actions" {items} arc={{ from: 90, to: 180 }} radius="7rem" scrim={false}>
		{#snippet trigger({ open: fanned })}
			<span class="face">{fanned ? '✕' : '+'}</span>
		{/snippet}
	</RadialMenu>
</div>

<style>
	.corner {
		display: flex;
		justify-content: flex-end;
		padding: var(--sp-2);
		border: 1px dashed var(--border);
		border-radius: var(--r-md);
	}
	.face {
		font-size: var(--fs-lg);
		font-weight: var(--fw-bold);
	}
</style>
