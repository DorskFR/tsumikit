<script module>
	export const meta = {
		title: 'States',
		caption: 'disabled, multiple={false} keeping only the first file, custom children inside the box, and a narrow zone whose label wraps.',
		layout: 'grid'
	};
</script>

<script lang="ts">
	import { Dropzone, Icon, Text, toasts } from '@dorsk/tsumikit';

	let one = $state('');
</script>

<Dropzone disabled label="Uploads paused" hint="Storage quota reached" onfiles={() => {}} />
<Dropzone multiple={false} accept=".zip" label={one || 'One archive'} hint="Only the first .zip is kept" onfiles={(f) => (one = f[0].name)} />
<Dropzone label="Replace cover art" hint="Square PNG, at least 600px" accept="image/*" onfiles={(f) => toasts.show(f[0].name)}>
	<span class="art"><Icon name="image" size={28} /><Text size="xs" tone="muted">Current: neon-rain.png</Text></span>
</Dropzone>
<div class="narrow">
	<Dropzone label="Drop the exported ledger spreadsheet for reconciliation" hint="xlsx or csv" onfiles={(f) => toasts.show(f[0].name)} />
</div>

<style>
	.art {
		display: grid;
		justify-items: center;
		gap: var(--sp-1);
	}
	.narrow {
		max-width: 11rem;
	}
</style>
