<script module>
	export const meta = {
		title: 'Upload attachments',
		caption: 'accept filters dropped files by extension or mime pattern; onfiles feeds an AttachmentList with the real File objects.',
		layout: 'stack'
	};
</script>

<script lang="ts">
	import { AttachmentList, Dropzone } from '@dorsk/tsumikit';

	let files = $state<File[]>([]);
</script>

<div class="upload">
	<Dropzone accept="image/*,.pdf" label="Drop screenshots or PDFs" hint="or click to browse, up to 25 MB each" onfiles={(f) => (files = [...files, ...f])} />
	{#if files.length}
		<AttachmentList {files} onremove={(i) => (files = files.filter((_, j) => j !== i))} />
	{/if}
</div>

<style>
	.upload {
		display: grid;
		gap: var(--sp-3);
		max-width: 36rem;
	}
</style>
