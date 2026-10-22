<script module>
	export const meta = {
		title: 'Widths and alignment',
		caption: 'size caps the column (any CSS length, default --content-max); size="none" fills the parent; align="start" drops the centering. Tinted = gutter, solid = content.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Container, Text } from '@dorsk/tsumikit';

	const rows = [
		{ label: 'size="18rem"', size: '18rem' },
		{ label: 'size="30rem"', size: '30rem' },
		{ label: 'size="30rem" align="start"', size: '30rem', align: 'start' as const },
		{ label: 'size="none"', size: 'none' }
	];
</script>

{#each rows as row (row.label)}
	<div class="parent">
		<Container size={row.size} align={row.align} class="ct-outline">
			<div class="content"><Text size="xs" mono>{row.label}</Text></div>
		</Container>
	</div>
{/each}

<style>
	.parent {
		background: var(--surface);
		border-radius: var(--r-sm);
	}
	:global(.ct-outline) {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
	}
	.content {
		padding: var(--sp-2);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
	}
</style>
