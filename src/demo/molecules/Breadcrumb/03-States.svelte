<script module>
	export const meta = {
		title: 'Overflow',
		caption: 'maxItems collapses the middle into an ellipsis; wrap={false} truncates inside a narrow box; a single item is just the current page.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Breadcrumb } from '@dorsk/tsumikit';

	const deep = ['Home', 'Library', 'Artists', 'June Hollow', 'Low Tide'].map((label) => ({ label, href: '#breadcrumb' }));
</script>

<Breadcrumb maxItems={3} items={[...deep, { label: 'Paper Boats' }]} />
<div class="narrow">
	<Breadcrumb
		wrap={false}
		items={[
			{ label: 'Music', href: '#breadcrumb' },
			{ label: 'June Hollow', href: '#breadcrumb' },
			{ label: 'A rather long album title that should ellipsise instead of wrapping' }
		]}
	/>
</div>
<div class="narrow">
	<Breadcrumb items={[...deep, { label: 'Wrapping keeps every crumb readable on a phone' }]} />
</div>
<Breadcrumb items={[{ label: 'Inbox' }]} />

<style>
	.narrow {
		max-width: 18rem;
		border: 1px dashed var(--border);
		padding: var(--sp-2);
	}
</style>
