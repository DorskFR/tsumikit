<script module>
	export const meta = {
		title: 'Position',
		caption: '<Toaster position="left" | "center" | "right" /> picks the side of the edge the stack hugs. The page mounts its Toaster outside this example, so the control sets the data-position that prop renders.',
	};
</script>

<script lang="ts">
	import { Button, SegmentedControl, toasts } from '@dorsk/tsumikit';

	type Position = 'left' | 'center' | 'right';
	let position = $state<Position>('center');

	$effect(() => {
		const stack = document.querySelector<HTMLElement>('[data-tsu="Toaster"]');
		if (!stack) return;
		stack.dataset.position = position;
		return () => {
			stack.dataset.position = 'center';
		};
	});
</script>

<SegmentedControl
	label="Toaster position"
	bind:value={position}
	options={[
		{ value: 'left', label: 'left' },
		{ value: 'center', label: 'center' },
		{ value: 'right', label: 'right' }
	]}
/>
<Button onclick={() => toasts.info(`Stack on the ${position}`)}>Show toast</Button>
