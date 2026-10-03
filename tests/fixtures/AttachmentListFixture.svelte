<script lang="ts">
	import AttachmentList from '$lib/components/molecules/AttachmentList.svelte';

	let {
		files,
		tiles,
		numbered,
		onremove,
		onopen
	}: {
		files: { name: string; size?: number; type?: string; url?: string }[];
		tiles?: boolean | 'auto';
		numbered?: boolean;
		onremove?: (index: number) => void;
		onopen?: (index: number) => void;
	} = $props();
</script>

<AttachmentList {files} {tiles} {numbered} {onremove} {onopen} />
