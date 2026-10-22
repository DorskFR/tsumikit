<script module>
	export const meta = {
		title: 'Drag between pools',
		caption: 'droppable, accepts, dragPayload, ondrop and dropHint; the Move button is the keyboard path the drop target needs.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, Fieldset, Text } from '@dorsk/tsumikit';

	let pools = $state<Record<'standby' | 'active', string[]>>({
		standby: ['worker-02', 'worker-05'],
		active: ['worker-01', 'worker-03']
	});
	let dragging = $state('');

	function move(node: string, to: 'standby' | 'active') {
		const from = to === 'standby' ? 'active' : 'standby';
		pools = { ...pools, [from]: pools[from].filter((n) => n !== node), [to]: [...pools[to], node] };
	}
</script>

<div class="pools">
	{#each ['standby', 'active'] as const as id (id)}
		<Fieldset
			legend={id === 'standby' ? 'Standby' : 'Serving traffic'}
			tone={pools[id].length ? 'accent' : 'strong'}
			droppable
			accepts={(node) => !pools[id].includes(node)}
			dragPayload={dragging}
			ondrop={(node) => move(node, id)}
			dropHint="Drop to move here"
		>
			<div class="list">
				{#each pools[id] as node (node)}
					<Card
						padding="sm"
						draggable="true"
						ondragstart={(e: DragEvent) => {
							e.dataTransfer?.setData('text/plain', node);
							dragging = node;
						}}
						ondragend={() => (dragging = '')}
					>
						<div class="card">
							<Text mono size="sm">{node}</Text>
							<Button size="sm" variant="ghost" onclick={() => move(node, id === 'standby' ? 'active' : 'standby')}>Move</Button>
						</div>
					</Card>
				{:else}
					<Text size="sm" tone="muted">Empty</Text>
				{/each}
			</div>
		</Fieldset>
	{/each}
</div>

<style>
	.pools {
		display: grid;
		gap: var(--sp-3);
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		align-items: stretch;
	}
	.list {
		display: grid;
		gap: var(--sp-2);
	}
	.card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--sp-2);
	}
</style>
