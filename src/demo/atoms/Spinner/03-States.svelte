<script module>
	export const meta = {
		title: 'Sizes, tone and tempo',
		caption: 'size in px or 1em from the surrounding text; colour comes from the parent; --spinner-speed scales the tempo.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, Spinner, Text } from '@dorsk/tsumikit';
</script>

<Cluster align="center">
	<Spinner size={12} /><Spinner size={16} /><Spinner size={24} /><Spinner size={36} /><Spinner variant="arc" size={48} />
</Cluster>
<Cluster align="center">
	<Text tone="accent"><Spinner variant="dots" size={24} /></Text>
	<Text tone="success"><Spinner variant="orbit" size={24} /></Text>
	<Text tone="warn"><Spinner variant="bars" size={24} /></Text>
	<Text tone="danger"><Spinner variant="pulse" size={24} /></Text>
	<Text tone="muted"><Spinner variant="grid" size={24} /></Text>
</Cluster>
<Cluster align="center">
	<Spinner variant="arc" size={24} style="--spinner-speed: 2" />
	<Spinner variant="arc" size={24} />
	<Spinner variant="arc" size={24} style="--spinner-speed: 0.5" />
	<Text size="xs" tone="muted">slow · default · fast</Text>
</Cluster>
