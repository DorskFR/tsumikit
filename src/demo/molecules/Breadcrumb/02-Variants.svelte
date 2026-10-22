<script module>
	export const meta = {
		title: 'Sizes and separators',
		caption: 'size="sm" | "md", char swaps the glyph, separator is a snippet, collapseCurrent hides the last item on narrow screens.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Breadcrumb, Icon } from '@dorsk/tsumikit';

	const items = [
		{ label: 'Music', href: '#breadcrumb' },
		{ label: 'Kaleido', href: '#breadcrumb' },
		{ label: 'Neon Rain', href: '#breadcrumb' },
		{ label: 'Night Drive' }
	];
</script>

<Breadcrumb {items} size="sm" />
<Breadcrumb {items} size="md" />
<Breadcrumb {items} char="/" />
<Breadcrumb {items}>
	{#snippet separator()}<Icon name="chevron-right" size={12} />{/snippet}
</Breadcrumb>
<Breadcrumb collapseCurrent items={[{ label: 'Films', href: '#breadcrumb' }, { label: 'Lantern (2024)' }]} />
