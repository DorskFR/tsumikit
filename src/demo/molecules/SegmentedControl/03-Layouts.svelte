<script module>
	export const meta = {
		title: 'Wrap, scroll, block and collapsing labels',
		caption: 'wrap folds segments onto rows; scroll keeps one row that pans; a pill wider than its box falls back to scrolling; block shares the width equally; collapseLabels="mobile" | "container" hides text under 48rem or in a narrow container.',
		layout: 'stack',
		resizable: true
	};
</script>

<script lang="ts">
	import { SegmentedControl, Text } from '@dorsk/tsumikit';
	import { queueFilters, scopeModes } from './data';
</script>

<Text size="xs" tone="muted">wrap, size sm</Text>
<div class="box"><SegmentedControl wrap size="sm" options={queueFilters} value="all" label="Queue wrapped" /></div>
<Text size="xs" tone="muted">scroll</Text>
<div class="box"><SegmentedControl scroll options={queueFilters} value="all" label="Queue scrolling" /></div>
<Text size="xs" tone="muted">overflowing, no wrap or scroll</Text>
<div class="box"><SegmentedControl options={queueFilters} value="all" label="Queue overflowing" /></div>
<Text size="xs" tone="muted">block</Text>
<SegmentedControl block options={scopeModes} value="album" label="Scope block" />
<Text size="xs" tone="muted">collapseLabels="mobile"</Text>
<SegmentedControl variant="icon" collapseLabels="mobile" options={scopeModes} value="album" label="Scope mobile" />
<Text size="xs" tone="muted">collapseLabels="container" (drag the handle)</Text>
<div class="container"><SegmentedControl variant="icon" collapseLabels="container" options={scopeModes} value="album" label="Scope in container" /></div>

<style>
	.box {
		max-width: 16rem;
	}
	.container {
		container-type: inline-size;
	}
</style>
