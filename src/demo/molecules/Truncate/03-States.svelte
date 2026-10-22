<script module>
	export const meta = {
		title: 'Fit, fits and tooltips',
		caption: 'fit measures the host and shows the longest candidate that fits (drag the handle), grow claims the free space of a flex row; text within budget renders as-is with no tooltip; tooltip={false} and placement control the reveal.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Badge, Text, Truncate } from '@dorsk/tsumikit';

	const path = '/home/amara/Documents/tsumikit/src/demo/molecules/Truncate/03-States.svelte';
</script>

<div class="row">
	<Badge size="sm">fit + grow</Badge>
	<Truncate text={path} mode="path" fit grow mono />
</div>
<div class="row">
	<Badge size="sm">fit, middle</Badge>
	<Truncate text="sha256:4f1c9e0b7a2d38c5e6f90a1b2c3d4e5f60718293a4b5c6d7e8f9012345678abc" mode="middle" fit grow mono />
</div>
<Text size="sm">fits, so no tooltip: <Truncate text="short" max={20} /></Text>
<Text size="sm">tooltip off: <Truncate text="a-very-long-resource-identifier" max={12} tooltip={false} /></Text>
<Text size="sm">placement="bottom": <Truncate text="a-very-long-resource-identifier" max={12} placement="bottom" /></Text>
<Text size="sm">empty: [<Truncate text="" max={8} />]</Text>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
	}
</style>
