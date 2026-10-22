<script lang="ts">
	import { SoundSettings } from '@dorsk/tsumikit';
	import DemoShell from '../../demo/framework/DemoShell.svelte';
</script>

<DemoShell>
	{#snippet toolbar()}
		<SoundSettings size="sm" />
	{/snippet}
</DemoShell>
