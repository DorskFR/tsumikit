<script module>
	export const meta = {
		title: 'Loading styles',
		caption:
			'loadingStyle: spinner (default) prepends a spinner; morph dissolves the label into a centred spinner and springs doneLabel back in at constant width; fill pours progress in from the left and recolours the label as it passes.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { Button, Cluster } from '@dorsk/tsumikit';

	let save: boolean | 'done' = $state(false);
	let upload = $state(0);
	let uploading = $state(false);

	function startSave() {
		save = true;
		setTimeout(() => {
			save = 'done';
			setTimeout(() => (save = false), 1400);
		}, 1800);
	}

	function startUpload() {
		uploading = true;
		upload = 0;
		const step = setInterval(() => {
			upload = Math.min(1, upload + 0.07 + Math.random() * 0.1);
			if (upload >= 1) {
				clearInterval(step);
				setTimeout(() => {
					uploading = false;
					upload = 0;
				}, 1200);
			}
		}, 260);
	}
</script>

<Cluster>
	<Button variant="primary" loading>Deploying</Button>
	<Button loading="done">Deployed</Button>
	<Button variant="primary" loadingStyle="morph" loading={save} doneLabel="Saved" onclick={startSave}>Save changes</Button>
	<Button loadingStyle="fill" loading={uploading} progress={upload} onclick={startUpload} style="min-width: 11em">
		{uploading ? `Uploading ${Math.round(upload * 100)}%` : 'Upload 3 files'}
	</Button>
	<Button variant="primary" loadingStyle="fill" loading progress={0.6}>Primary 60%</Button>
</Cluster>
