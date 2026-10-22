<script module>
	export const meta = {
		title: 'List, rows and swatches',
		caption: 'variant="list" (default) with hint, "rows" with description, "swatch" with color; onfocuschange drives a preview on hover or arrow keys.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Callout, RadioGroup } from '@dorsk/tsumikit';
	import { previews, strategies } from './data';

	let channel = $state('email');
	let strategy = $state('plan');
	let preview = $state('plan');
	let accent = $state('violet');
</script>

<RadioGroup
	label="Notifications"
	bind:value={channel}
	options={[
		{ value: 'email', label: 'Email', hint: 'Daily digest' },
		{ value: 'sms', label: 'SMS', hint: 'Urgent only' },
		{ value: 'push', label: 'Push', hint: 'Everything, as it happens' }
	]}
/>
<div class="stack">
	<RadioGroup label="Strategy" variant="rows" options={strategies} bind:value={strategy} onfocuschange={(v) => (preview = v)} />
	<Callout tone="info">{previews[preview]}</Callout>
</div>
<RadioGroup
	label="Accent colour"
	variant="swatch"
	bind:value={accent}
	options={[
		{ value: 'violet', label: 'Violet', color: 'oklch(0.6 0.2 300)' },
		{ value: 'teal', label: 'Teal', color: 'oklch(0.7 0.14 190)' },
		{ value: 'amber', label: 'Amber', color: 'oklch(0.78 0.16 75)' },
		{ value: 'rose', label: 'Rose', color: 'oklch(0.65 0.2 10)' },
		{ value: 'accent', label: 'Theme accent', color: 'var(--accent)' }
	]}
/>

<style>
	.stack {
		display: grid;
		gap: var(--sp-2);
	}
</style>
