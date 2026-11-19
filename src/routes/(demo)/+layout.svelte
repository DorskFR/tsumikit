<script lang="ts">
	import { SoundSettings } from '@dorsk/tsumikit';
	import { page } from '$app/state';
	import DemoShell from '../../demo/framework/DemoShell.svelte';

	let { children } = $props();
</script>

<DemoShell active={page.params.id}>
	{#snippet toolbar()}
		<SoundSettings size="sm" />
	{/snippet}
	{@render children()}
</DemoShell>
