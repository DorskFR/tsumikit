<script module>
	export const meta = {
		title: 'Message reactions',
		caption: 'placement="top-end" opens above a message footer; columns={6} narrows the grid; the picked glyphs become Toggle chips with counts.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, EmojiPicker, Text, Toggle } from '@dorsk/tsumikit';

	let reactions = $state<{ emoji: string; count: number; mine: boolean }[]>([
		{ emoji: '👍', count: 3, mine: false },
		{ emoji: '🚀', count: 1, mine: true }
	]);

	function react(emoji: string) {
		const r = reactions.find((x) => x.emoji === emoji);
		if (!r) reactions = [...reactions, { emoji, count: 1, mine: true }];
		else if (r.mine) {
			r.mine = false;
			r.count -= 1;
			reactions = reactions.filter((x) => x.count > 0);
		} else {
			r.mine = true;
			r.count += 1;
		}
	}
</script>

<div class="message">
	<Text size="sm">Deploy of api-gateway 2.14 finished in eu-west-1.</Text>
	<Cluster gap="var(--sp-1)" align="center">
		{#each reactions as r (r.emoji)}
			<Toggle pill pressed={r.mine} onclick={() => react(r.emoji)}>{r.emoji} {r.count}</Toggle>
		{/each}
		<EmojiPicker label="Add a reaction" placement="top-end" columns={6} onselect={react} />
	</Cluster>
</div>

<style>
	.message {
		display: grid;
		gap: var(--sp-2);
		max-width: 28rem;
	}
</style>
