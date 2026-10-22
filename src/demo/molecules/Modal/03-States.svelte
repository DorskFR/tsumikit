<script module>
	export const meta = {
		title: 'Busy, scrolling body, resizable, filled footer',
		caption: 'busy blocks Escape and the backdrop; maxHeight scrolls the body; resizeKey adds a desktop drag edge that persists; footerFill hands the footer one wide layout.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AutoGrid, Button, Cluster, Modal, Text } from '@dorsk/tsumikit';

	let which = $state<'busy' | 'scroll' | 'resize' | 'fill' | null>(null);
	let rotating = $state(false);
	const close = () => (which = null);
	function rotate() {
		rotating = true;
		setTimeout(() => (rotating = false), 2500);
	}
	const lines = Array.from({ length: 40 }, (_, i) => `${String(i + 1).padStart(2, '0')}  worker-02 · GET /v1/jobs · 200 · ${120 + i * 7} ms`);
</script>

<Cluster align="center">
	<Button size="sm" onclick={() => (which = 'busy')}>Busy</Button>
	<Button size="sm" onclick={() => (which = 'scroll')}>Long body</Button>
	<Button size="sm" onclick={() => (which = 'resize')}>Resizable</Button>
	<Button size="sm" onclick={() => (which = 'fill')}>Filled footer</Button>
</Cluster>

<Modal open={which === 'busy'} onclose={close} title="Rotate credentials" busy={rotating} size="sm">
	{#snippet body()}<Text>While busy the body is inert and Escape, the backdrop and the close button wait until the work settles.</Text>{/snippet}
	{#snippet footer()}
		<Button onclick={close} disabled={rotating}>Cancel</Button>
		<Button variant="primary" loading={rotating} onclick={rotate}>Rotate now</Button>
	{/snippet}
</Modal>
<Modal open={which === 'scroll'} onclose={close} title="Request log" maxHeight="60vh">
	{#snippet body()}
		<pre class="log">{lines.join('\n')}</pre>
	{/snippet}
	{#snippet footer()}<Button onclick={close}>Close</Button>{/snippet}
</Modal>
<Modal open={which === 'resize'} onclose={close} title="Query editor" resizeKey="demo-modal-width" size="lg">
	{#snippet body()}<Text>Drag the right edge on desktop. The width is remembered under resizeKey.</Text>{/snippet}
	{#snippet footer()}<Button onclick={close}>Close</Button>{/snippet}
</Modal>
<Modal open={which === 'fill'} onclose={close} title="Choose a plan" footerFill>
	{#snippet body()}<Text>With footerFill the footer owns the whole row, here an AutoGrid of equal actions.</Text>{/snippet}
	{#snippet footer()}
		<AutoGrid min="8rem">
			<Button block onclick={close}>Free</Button>
			<Button block variant="primary" onclick={close}>Team</Button>
			<Button block tone="accent" onclick={close}>Enterprise</Button>
		</AutoGrid>
	{/snippet}
</Modal>

<style>
	.log {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--fs-sm);
		white-space: pre;
		overflow-x: auto;
	}
</style>
