<script lang="ts">
	import SplitButton from '../../src/lib/components/molecules/SplitButton.svelte';

	let {
		variant = 'default',
		size = 'md',
		control = false,
		caret = 'square',
		disabled = false,
		menuDisabled = false,
		onclick,
		onselect,
		primaryProps,
		rootProps
	}: {
		variant?: 'default' | 'primary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		control?: boolean;
		caret?: 'square' | 'half';
		disabled?: boolean;
		menuDisabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		onselect?: (label: string) => void;
		primaryProps?: Record<string, unknown>;
		rootProps?: Record<string, unknown>;
	} = $props();

	const items = [
		{ label: 'Later today', onselect: () => onselect?.('Later today') },
		{ label: 'Tomorrow 9:00', onselect: () => onselect?.('Tomorrow 9:00') }
	];
</script>

<button type="button" id="before">before</button>
<SplitButton
	label="Send options"
	{items}
	{variant}
	{size}
	{control}
	{caret}
	{disabled}
	{menuDisabled}
	{onclick}
	{primaryProps}
	{...rootProps}
>
	Send
</SplitButton>
<button type="button" id="after">after</button>
