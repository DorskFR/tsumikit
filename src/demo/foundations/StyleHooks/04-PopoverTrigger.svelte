<script module>
	export const meta = {
		title: 'A Popover trigger that matches its Toggle siblings',
		caption: 'pill + size="sm" plus the --pop-trigger-pad/size/bg/fg/border hooks make the trigger sit in a row of filter chips.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Popover, Text, Toggle } from '@dorsk/tsumikit';

	let failing = $state(true);
	let mine = $state(false);
</script>

<Toggle pill pressed={failing} onclick={() => (failing = !failing)}>Failing</Toggle>
<Toggle pill pressed={mine} onclick={() => (mine = !mine)}>Assigned to me</Toggle>
<Popover
	label="More filters"
	pill
	style="--pop-box: auto; --pop-trigger-pad: 0.15rem var(--sp-2); --pop-trigger-size: var(--fs-xs); --pop-trigger-bg: var(--bg-elevated-2); --pop-trigger-fg: var(--text-muted); --pop-trigger-border: var(--border)"
>
	{#snippet trigger()}More filters{/snippet}
	<Text size="sm">Region, runner and branch filters go here.</Text>
</Popover>
