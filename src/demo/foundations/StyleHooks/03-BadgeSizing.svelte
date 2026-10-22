<script module>
	export const meta = {
		title: 'Badge size axis',
		caption: 'numeric reserves and centres the box; --badge-min-size squares it; --badge-fs and --badge-fw set the typography.',
		layout: 'row'
	};
</script>

<script lang="ts">
	import { Badge } from '@dorsk/tsumikit';
</script>

<Badge numeric size="sm">7</Badge>
<Badge numeric size="sm" tone="info" style="--badge-min-size: 1.5rem; --badge-fs: var(--fs-sm); --badge-fw: var(--fw-semibold)">7</Badge>
<Badge numeric size="sm" tone="accent" style="--badge-min-size: 2rem; --badge-fs: var(--fs-base); --badge-fw: var(--fw-bold)">42</Badge>
<Badge numeric tone="danger" style="--badge-min-size: 2.5rem; --badge-fs: var(--fs-lg); --badge-fw: var(--fw-bold)">999+</Badge>
