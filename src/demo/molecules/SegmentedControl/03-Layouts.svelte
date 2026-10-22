<script module>
	export const meta = {
		title: 'Wrap, scroll, block and collapsing labels',
		caption: 'wrap folds segments onto rows; scroll keeps one row that pans; block shares the width equally; collapseLabels="mobile" | "container" hides text under 48rem or in a narrow container.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { SegmentedControl, Text, type SegmentOption } from '@dorsk/tsumikit';

	const queue: SegmentOption[] = [
		{ value: 'all', label: 'All', count: 1234 },
		{ value: 'queued', label: 'Queued', count: 3 },
		{ value: 'downloading', label: 'Downloading' },
		{ value: 'failed', label: 'Failed', count: 12 },
		{ value: 'completed', label: 'Completed' }
	];
	const scopes: SegmentOption[] = [
		{ value: 'album', label: 'By album', icon: 'disc' },
		{ value: 'artist', label: 'By artist', icon: 'users' },
		{ value: 'year', label: 'By year', icon: 'calendar' }
	];
</script>

<Text size="xs" tone="muted">wrap, size sm</Text>
<div class="box"><SegmentedControl wrap size="sm" options={queue} value="all" label="Queue wrapped" /></div>
<Text size="xs" tone="muted">scroll</Text>
<div class="box"><SegmentedControl scroll options={queue} value="all" label="Queue scrolling" /></div>
<Text size="xs" tone="muted">block</Text>
<SegmentedControl block options={scopes} value="album" label="Scope block" />
<Text size="xs" tone="muted">collapseLabels="mobile"</Text>
<SegmentedControl variant="icon" collapseLabels="mobile" options={scopes} value="album" label="Scope mobile" />
<Text size="xs" tone="muted">collapseLabels="container" (drag the handle)</Text>
<div class="container"><SegmentedControl variant="icon" collapseLabels="container" options={scopes} value="album" label="Scope in container" /></div>

<style>
	.box {
		max-width: 16rem;
	}
	.container {
		container-type: inline-size;
	}
</style>
