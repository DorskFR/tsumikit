<script module>
	export const meta = {
		title: 'Unknown user, presence and accessibility',
		caption: 'an empty name renders a hidden ? tile; the status snippet pins a Dot top-right; decorative drops the accessible name when the row has one.'
	};
</script>

<script lang="ts">
	import { Avatar, Cluster, Dot, Text } from '@dorsk/tsumikit';
</script>

<Avatar name="" size="lg" />
<Avatar name="Revoked user" size="lg" tone="neutral" />
<Avatar name="Priya Nair" size="lg">
	{#snippet status()}<Dot status="active" ring />{/snippet}
</Avatar>
<Avatar name="Priya Nair" size="sm" tone="accent">
	{#snippet status()}<Dot color="var(--danger)" ring />{/snippet}
</Avatar>
<Cluster gap="var(--sp-2)" align="center">
	<Avatar name="Sam Doyle" size="sm" decorative />
	<Text size="sm">Sam Doyle</Text>
</Cluster>
<Cluster gap="var(--sp-2)" align="center">
	<Avatar name="Sam Doyle" size="sm" />
	<Text size="sm" tone="muted">named for assistive tech</Text>
</Cluster>
