<script module>
	export const meta = {
		title: 'Sizes, buffering and preview tip',
		caption: 'size="sm" | "md"; buffered draws [start, end] ranges; previewSnippet renders above the hover time; formatTime swaps the clock.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { SeekSlider, Text } from '@dorsk/tsumikit';

	const chapters = [
		{ at: 0, title: 'Cold open' },
		{ at: 420, title: 'Interview' },
		{ at: 1980, title: 'Listener mail' },
		{ at: 2900, title: 'Outro' }
	];
	const chapterAt = (s: number) => chapters.findLast((c) => c.at <= s)?.title ?? '';
	const asMinutes = (s: number) => `${Math.round(s / 60)} min`;
</script>

<Text size="xs" tone="muted">size="sm", a single buffered range</Text>
<SeekSlider size="sm" value={40} max={243} buffered={[[0, 120]]} label="Small seek" />
<Text size="xs" tone="muted">size="md", gaps in the buffer after seeking ahead</Text>
<SeekSlider value={300} max={1425} buffered={[[0, 420], [780, 1100]]} label="Medium seek" />
<Text size="xs" tone="muted">previewSnippet: hover the podcast to see the chapter</Text>
<SeekSlider value={600} max={3120} label="Podcast seek">
	{#snippet previewSnippet(s)}
		<Text size="xs" weight="semibold">{chapterAt(s)}</Text>
	{/snippet}
</SeekSlider>
<Text size="xs" tone="muted">formatTime: whole minutes for an audiobook</Text>
<SeekSlider value={7200} max={36000} formatTime={asMinutes} label="Audiobook seek" />
