<script lang="ts">
	import DemoSection from '../../../../demo/framework/DemoSection.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.entry.name} · @dorsk/tsumikit</title>
</svelte:head>

<DemoSection entry={data.entry} content={data.content} />
