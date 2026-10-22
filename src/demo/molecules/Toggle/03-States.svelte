<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled on and off, struck for a muted-but-on filter, sound={false}, and a long label (chips never wrap) truncating in a narrow row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Toggle } from '@dorsk/tsumikit';

	let quiet = $state(true);
</script>

<Cluster align="center">
	<Toggle disabled pressed={false}>Off, locked</Toggle>
	<Toggle disabled pressed>On, locked</Toggle>
	<Toggle struck pressed onclick={() => {}}>Hidden by filter</Toggle>
	<Toggle sound={false} pressed={quiet} onclick={() => (quiet = !quiet)}>Silent click</Toggle>
</Cluster>
<div class="narrow">
	<Toggle grow pressed onclick={() => {}}>Mentions a deploy in the last seven days</Toggle>
</div>

<style>
	.narrow {
		display: flex;
		max-width: 12rem;
	}
</style>
