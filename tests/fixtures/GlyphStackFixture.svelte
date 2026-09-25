<script lang="ts">
	import GlyphStack from '../../src/lib/components/molecules/GlyphStack.svelte';

	let {
		stack = 'auto',
		stackBelow = '30rem',
		container = undefined,
		mode = 'items',
		count = 4,
		expand = 'none',
		withAction = false
	}: {
		stack?: 'never' | 'always' | 'auto';
		stackBelow?: string;
		container?: string;
		mode?: 'items' | 'children';
		count?: number;
		expand?: 'none' | 'tap' | 'slide';
		withAction?: boolean;
	} = $props();

	let pins = $state(0);
	let accounts = $state(0);
	let actions = $state(0);
</script>

<output id="pins">{pins}</output>
<output id="accounts">{accounts}</output>
<output id="actions">{actions}</output>

{#snippet pin()}<button type="button" id="pin" onclick={() => pins++}>☆</button>{/snippet}
{#snippet dot()}<span id="dot">●</span>{/snippet}
{#snippet machine()}<a href="#m" id="machine">devbox</a>{/snippet}
{#snippet machineTile()}<a href="#m" id="machine-tile">d</a>{/snippet}
{#snippet account()}<button type="button" id="account" onclick={() => accounts++}>A</button>{/snippet}
{#snippet bigDot()}<span class="big-dot">●</span>{/snippet}
{#snippet extra()}<span id="extra">x</span>{/snippet}

<div id="outer" style="container-name: outer; container-type: inline-size">
	<div id="inner" style="container-type: inline-size">
		{#if mode === 'items'}
			<GlyphStack
				{stack}
				{stackBelow}
				{container}
				{expand}
				expandLabel="Session glyphs"
				class="from-consumer"
				data-x="y"
				items={[
					{ inline: pin, action: withAction ? () => actions++ : undefined },
					{ inline: dot, expanded: bigDot },
					{ inline: machine, stacked: machineTile },
					{ inline: account },
					{ inline: extra }
				].slice(0, count)}
			/>
		{:else}
			<GlyphStack {stack} {stackBelow} {container} {expand} class="from-consumer">
				{@render pin()}
				{@render dot()}
				{@render machine()}
				{@render account()}
			</GlyphStack>
		{/if}
	</div>
</div>
