<script module>
	export const meta = {
		title: 'States',
		caption: 'state="idle" | "loading" | "error" | "done"; only idle and error are clickable.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { LoadMore, Text, toasts } from '@dorsk/tsumikit';
</script>

<div class="col"><Text size="xs" tone="muted">idle</Text><LoadMore state="idle" onload={() => toasts.show('Loading…')} /></div>
<div class="col"><Text size="xs" tone="muted">loading</Text><LoadMore state="loading" /></div>
<div class="col"><Text size="xs" tone="muted">error</Text><LoadMore state="error" onload={() => toasts.show('Retrying…')} /></div>
<div class="col"><Text size="xs" tone="muted">done</Text><LoadMore state="done" /></div>

<style>
	.col {
		display: grid;
		gap: var(--sp-2);
		justify-items: start;
	}
</style>
