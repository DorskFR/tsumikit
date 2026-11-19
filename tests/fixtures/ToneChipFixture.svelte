<script lang="ts">
	import SegmentedProgress, { type ProgressSegment } from '$lib/components/atoms/SegmentedProgress.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import type { Tone } from '$lib/tone';

	const tones: Tone[] = ['accent', 'ok', 'success', 'warn', 'danger', 'info', 'neutral'];
	const segments: ProgressSegment[] = [...tones, 'muted' as const].map((tone) => ({ value: 4, max: 5, tone }));
</script>

<EmptyState id="default" icon="archive" title="default" />
{#each tones as tone (tone)}
	<EmptyState id="empty-{tone}" icon="archive" title={tone} {tone} />
{/each}
<SegmentedProgress id="segments" label="segments" {segments} />
<SegmentedProgress id="stacked" mode="stacked" label="stacked" {segments} />
<SegmentedProgress id="untoned" label="untoned" segments={[{ value: 1, max: 2 }]} />
