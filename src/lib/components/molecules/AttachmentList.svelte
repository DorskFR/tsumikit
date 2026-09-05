<script lang="ts">
	// Removable file chips for a composer or upload form.
	import Badge from '$lib/components/atoms/Badge.svelte';

	export type Attachment = { name: string; size?: number };

	let {
		files,
		onremove,
		class: klass = '',
		style: styleProp = ''
	}: {
		files: (File | Attachment)[];
		onremove?: (index: number) => void;
		class?: string;
		style?: string;
	} = $props();

	function fmt(size: number | undefined): string {
		if (size === undefined) return '';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}
</script>

{#if files.length}
	<ul data-tsu="AttachmentList" class="attachments {klass}" style={styleProp}>
		{#each files as f, i (`${f.name}-${i}`)}
			<li>
				<Badge
					mono
					truncate
					maxWidth="16rem"
					removable={!!onremove}
					onremove={() => onremove?.(i)}
					title={f.name}
				>
					{f.name}{#if f.size !== undefined}<span class="size">{fmt(f.size)}</span>{/if}
				</Badge>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.size {
		margin-inline-start: var(--sp-1);
		color: var(--text-faint);
	}
</style>
