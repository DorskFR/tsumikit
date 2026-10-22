<script module>
	export const meta = {
		title: 'Overlay on a surface',
		caption: 'overlay wraps interactive content with no box; the dashed layer paints only while a file is dragged over; onactive lets the host react.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Card, Dropzone, FileButton, Heading, Text, toasts } from '@dorsk/tsumikit';

	let hovering = $state(false);
	const onfiles = (f: File[]) => toasts.ok(`Attached ${f.map((x) => x.name).join(', ')}`);
</script>

<Dropzone overlay label="Drop to attach to the ticket" onactive={(a) => (hovering = a)} {onfiles}>
	<Card padding="lg">
		<Heading level={3} size="md">Rollback api-gateway to 2.13</Heading>
		<Text size="sm" tone="muted">{hovering ? 'Release to attach.' : 'Buttons stay clickable; drag a file anywhere over this card.'}</Text>
		<div class="actions">
			<FileButton label="Attach" variant="ghost" multiple {onfiles} />
			<Button onclick={() => toasts.show('Comment posted')}>Comment</Button>
		</div>
	</Card>
</Dropzone>

<style>
	.actions {
		display: flex;
		gap: var(--sp-2);
		margin-top: var(--sp-3);
	}
</style>
