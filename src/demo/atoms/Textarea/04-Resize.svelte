<script module>
	export const meta = {
		title: 'Resize handles',
		caption: 'resize="bottom" (default) or "top" draws a drag grip; with autoresize the grip sets a floor the text still grows past; "none" removes it.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Textarea } from '@dorsk/tsumikit';
</script>

<Cluster align="flex-start">
	<Textarea rows={2} resize="bottom" placeholder="Drag the bottom grip" aria-label="Bottom grip" />
	<Textarea rows={2} resize="top" placeholder="Drag the top grip" aria-label="Top grip" />
	<Textarea rows={2} resize="none" placeholder="No grip" aria-label="No grip" />
</Cluster>
<Textarea
	block
	autoresize
	resize="top"
	rows={1}
	placeholder="One row when empty; type to grow, drag the top grip to reserve more space"
	aria-label="Autoresize with floor"
/>
