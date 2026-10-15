<script lang="ts">
	import RadialMenu from '../../src/lib/components/molecules/RadialMenu.svelte';

	let { props = {} }: { props?: Record<string, unknown> } = $props();

	let open = $state(false);
	let picked = $state<string[]>([]);
	let events = $state<string[]>([]);
	const pick = (label: string) => () => (picked = [...picked, label]);
	const items = [
		{ label: 'Disarm', icon: 'stop' as const, danger: true, onselect: pick('Disarm') },
		{ label: 'Mode', icon: 'settings' as const, onselect: pick('Mode') },
		{ label: 'Go zone', icon: 'arrow-right' as const, onselect: pick('Go zone') },
		{ label: 'Sell all', icon: 'tag' as const, disabled: true, onselect: pick('Sell all') },
		{ label: 'Recover', icon: 'plus' as const, onselect: pick('Recover') },
		{ label: 'Menu', icon: 'menu' as const, onselect: pick('Menu') }
	];
</script>

<button type="button" id="before">before</button>
<output id="picked">{picked.join(',')}</output>
<output id="events">{events.join(',')}</output>
<output id="state">{open}</output>
<RadialMenu
	label="Bot"
	{items}
	caption="● bot"
	bind:open
	onopen={() => (events = [...events, 'open'])}
	onclose={() => (events = [...events, 'close'])}
	data-test="fab"
	{...props}
>
	{#snippet status()}<span id="status-line">Armed · explore</span>{/snippet}
</RadialMenu>
