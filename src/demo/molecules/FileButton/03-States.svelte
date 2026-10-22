<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, multiple with accept filtering, hitArea="compact" in a dense row, and a long label (buttons never wrap) truncating in a narrow box.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Cluster, FileButton, Text, toasts } from '@dorsk/tsumikit';

	let names = $state<string[]>([]);
</script>

<Cluster align="center">
	<FileButton label="Quota reached" disabled onfiles={() => {}} />
	<FileButton label="Add screenshots" multiple accept="image/png,image/jpeg" variant="primary" onfiles={(f) => (names = f.map((x) => x.name))} />
	<Text size="sm" tone="muted">{names.length ? names.join(', ') : 'PNG or JPEG only; other types are filtered by the picker.'}</Text>
</Cluster>
<Cluster align="center">
	<FileButton label="Attach" box="xs" hitArea="compact" variant="ghost" onfiles={(f) => toasts.show(`${f.length} file(s)`)} />
	<FileButton label="Attach" box="xs" hitArea="compact" variant="ghost" onfiles={(f) => toasts.show(`${f.length} file(s)`)} />
	<Text size="xs" tone="muted">compact hit area for a dense toolbar</Text>
</Cluster>
<div class="narrow">
	<FileButton label="Upload the signed processing agreement" accept=".pdf" onfiles={(f) => toasts.show(f[0].name)} />
</div>

<style>
	.narrow {
		max-width: 12rem;
	}
</style>
