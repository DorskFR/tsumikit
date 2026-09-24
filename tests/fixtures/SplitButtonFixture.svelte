<script lang="ts">
	import SplitButton from '../../src/lib/components/molecules/SplitButton.svelte';

	let {
		variant = 'default',
		size = 'md',
		control = false,
		disabled = false,
		menuDisabled = false,
		onclick,
		onselect
	}: {
		variant?: 'default' | 'primary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		control?: boolean;
		disabled?: boolean;
		menuDisabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		onselect?: (label: string) => void;
	} = $props();

	const items = [
		{ label: 'Later today', onselect: () => onselect?.('Later today') },
		{ label: 'Tomorrow 9:00', onselect: () => onselect?.('Tomorrow 9:00') }
	];
</script>

<button type="button" id="before">before</button>
<SplitButton label="Send options" {items} {variant} {size} {control} {disabled} {menuDisabled} {onclick}>
	Send
</SplitButton>
<button type="button" id="after">after</button>
