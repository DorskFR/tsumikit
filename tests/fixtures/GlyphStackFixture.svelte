<script lang="ts">
	import GlyphStack from '../../src/lib/components/molecules/GlyphStack.svelte';

	let {
		stack = 'auto',
		stackBelow = '30rem',
		container = undefined,
		mode = 'items',
		count = 4
	}: {
		stack?: 'never' | 'always' | 'auto';
		stackBelow?: string;
		container?: string;
		mode?: 'items' | 'children';
		count?: number;
	} = $props();
</script>

{#snippet pin()}<button type="button" id="pin">☆</button>{/snippet}
{#snippet dot()}<span id="dot">●</span>{/snippet}
{#snippet machine()}<a href="#m" id="machine">devbox</a>{/snippet}
{#snippet machineTile()}<a href="#m" id="machine-tile">d</a>{/snippet}
{#snippet account()}<button type="button" id="account">A</button>{/snippet}
{#snippet extra()}<span id="extra">x</span>{/snippet}

<div id="outer" style="container-name: outer; container-type: inline-size">
	<div id="inner" style="container-type: inline-size">
		{#if mode === 'items'}
			<GlyphStack
				{stack}
				{stackBelow}
				{container}
				class="from-consumer"
				data-x="y"
				items={[
					{ inline: pin },
					{ inline: dot },
					{ inline: machine, stacked: machineTile },
					{ inline: account },
					{ inline: extra }
				].slice(0, count)}
			/>
		{:else}
			<GlyphStack {stack} {stackBelow} {container} class="from-consumer">
				{@render pin()}
				{@render dot()}
				{@render machine()}
				{@render account()}
			</GlyphStack>
		{/if}
	</div>
</div>
