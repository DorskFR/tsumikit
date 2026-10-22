<script module>
	export const meta = {
		title: 'Import a CSV',
		caption: 'accept, variant="primary", onfiles receiving the picked File[]; the same input can be picked twice in a row.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, FileButton, Text } from '@dorsk/tsumikit';

	let picked = $state<File | null>(null);
</script>

<Cluster align="center">
	<FileButton variant="primary" label="Import transactions" icon="upload" accept=".csv,text/csv" onfiles={(f) => (picked = f[0])} />
	<Text size="sm" tone="muted">
		{picked ? `${picked.name} · ${(picked.size / 1024).toFixed(1)} KB` : 'CSV exports from your exchange, up to 50 MB.'}
	</Text>
</Cluster>
