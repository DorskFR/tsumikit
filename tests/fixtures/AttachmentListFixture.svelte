<script lang="ts">
	import AttachmentList from '$lib/components/molecules/AttachmentList.svelte';

	let {
		files,
		tiles,
		onremove
	}: {
		files: { name: string; size?: number; type?: string; url?: string }[];
		tiles?: boolean | 'auto';
		onremove?: (index: number) => void;
	} = $props();
</script>

<AttachmentList {files} {tiles} {onremove} />
