<script module>
	export const meta = {
		title: 'Sizes and tones',
		caption: 'size sm/md/lg/xl sets the desktop width; tone adds a title glyph and a coloured top border.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster, Modal, Text } from '@dorsk/tsumikit';

	const sizes = ['sm', 'md', 'lg', 'xl'] as const;
	const tones = ['neutral', 'info', 'ok', 'warn', 'danger', 'accent'] as const;
	let size = $state<(typeof sizes)[number] | null>(null);
	let tone = $state<(typeof tones)[number] | null>(null);
</script>

<Cluster align="center">
	{#each sizes as s (s)}
		<Button size="sm" onclick={() => (size = s)}>size {s}</Button>
	{/each}
</Cluster>
<Cluster align="center">
	{#each tones as t (t)}
		<Button size="sm" onclick={() => (tone = t)}>tone {t}</Button>
	{/each}
</Cluster>

{#each sizes as s (s)}
	<Modal open={size === s} onclose={() => (size = null)} title="Export report ({s})" size={s}>
		{#snippet body()}
			<Text>A {s} sheet is 24, 34, 48 or 72rem wide on desktop and full-width on phones.</Text>
		{/snippet}
		{#snippet footer()}<Button onclick={() => (size = null)}>Close</Button>{/snippet}
	</Modal>
{/each}
{#each tones as t (t)}
	<Modal open={tone === t} onclose={() => (tone = null)} title="Deploy to production" tone={t} size="sm">
		{#snippet body()}
			<Text>The title glyph and the top border take the {t} colour.</Text>
		{/snippet}
		{#snippet footer()}<Button onclick={() => (tone = null)}>Close</Button>{/snippet}
	</Modal>
{/each}
