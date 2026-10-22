<script module>
	export const meta = {
		title: 'Labels collapse with the bar width',
		caption: 'The bar is an inline-size query container: an @container rule hides button labels under 30rem, before anything overflows.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { Button, Icon, Toolbar } from '@dorsk/tsumikit';

	const actions = [
		{ label: 'Reply', icon: 'reply' },
		{ label: 'Forward', icon: 'share' },
		{ label: 'Archive', icon: 'archive' },
		{ label: 'Snooze', icon: 'clock' },
		{ label: 'Delete', icon: 'trash' }
	] as const;
</script>

<Toolbar label="Message actions">
	{#each actions as action (action.label)}
		<Button aria-label={action.label} title={action.label}>
			<Icon name={action.icon} />
			<span class="toolbar-label">{action.label}</span>
		</Button>
	{/each}
</Toolbar>

<style>
	@container (max-width: 30rem) {
		:global(.toolbar-label) {
			display: none;
		}
	}
</style>
