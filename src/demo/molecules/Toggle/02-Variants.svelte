<script module>
	export const meta = {
		title: 'Shapes, sizes and row sharing',
		caption: 'pill rounds the chip; size sm (default), md, lg; grow shares a row equally; shrink={false} keeps intrinsic width.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Toggle } from '@dorsk/tsumikit';

	let bold = $state(true);
	let italic = $state(false);
	let code = $state(false);
	let tab = $state('files');
</script>

<Cluster align="center">
	<Toggle pressed={bold} onclick={() => (bold = !bold)}>Bold</Toggle>
	<Toggle pill pressed={italic} onclick={() => (italic = !italic)}>Italic</Toggle>
	<Toggle size="md" pressed={code} onclick={() => (code = !code)}>Code</Toggle>
	<Toggle size="lg" pill pressed={bold} onclick={() => (bold = !bold)}>Large pill</Toggle>
</Cluster>
<div class="tabs">
	{#each [['files', 'Files'], ['diff', 'Diff'], ['logs', 'Logs']] as [id, label] (id)}
		<Toggle grow pressed={tab === id} onclick={() => (tab = id)}>{label}</Toggle>
	{/each}
	<Toggle shrink={false} pressed={false} onclick={() => {}}>Pinned width</Toggle>
</div>

<style>
	.tabs {
		display: flex;
		gap: var(--sp-1);
		max-width: 28rem;
	}
</style>
