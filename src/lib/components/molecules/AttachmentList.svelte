<script lang="ts">
	// Removable file chips; narrow containers (or `tiles`) collapse each file to a
	// tile whose Popover carries name, size and Remove. A Tooltip would not open on
	// iOS, where tapping never focuses a button. Both variants render and a
	// container query hides one with `display: none`, keeping it out of the tab order.
	import { untrack } from 'svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Text from '$lib/components/atoms/Text.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';

	export type Attachment = { name: string; size?: number; type?: string; url?: string };

	let {
		files,
		onremove,
		tiles = 'auto',
		removeLabel = 'Remove',
		class: klass = '',
		style: styleProp = ''
	}: {
		files: (File | Attachment)[];
		onremove?: (index: number) => void;
		/** `auto` switches to tiles when the list is at most 30rem wide. */
		tiles?: boolean | 'auto';
		removeLabel?: string;
		class?: string;
		style?: string;
	} = $props();

	function fmt(size: number | undefined): string {
		if (size === undefined) return '';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}

	function isImage(f: File | Attachment): boolean {
		return !!f.type?.startsWith('image/');
	}

	let objectUrls = $state<Map<File, string>>(new Map());

	$effect(() => {
		const prev = untrack(() => objectUrls);
		const next = new Map<File, string>();
		for (const f of files) {
			if (!(f instanceof File) || !isImage(f)) continue;
			next.set(f, prev.get(f) ?? URL.createObjectURL(f));
		}
		for (const [f, url] of prev) if (!next.has(f)) URL.revokeObjectURL(url);
		objectUrls = next;
	});

	$effect(() => () => {
		for (const url of untrack(() => objectUrls).values()) URL.revokeObjectURL(url);
	});

	function thumb(f: File | Attachment): string | undefined {
		if (!isImage(f)) return undefined;
		return f instanceof File ? objectUrls.get(f) : f.url;
	}
</script>

{#if files.length}
	<ul
		data-tsu="AttachmentList"
		class="attachments {klass}"
		class:auto={tiles === 'auto'}
		class:tiles={tiles === true}
		style={styleProp}
	>
		{#each files as f, i (`${f.name}-${i}`)}
			{#if tiles !== true}
				<li class="chip">
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
			{/if}
			{#if tiles !== false}
				<li class="tile">
					<Popover label={f.name} box="lg" placement="top-start" style="--pop-trigger-pad: 0; --pop-trigger-border: var(--border-strong); --pop-trigger-bg: var(--bg)">
						{#snippet trigger()}
							{@const src = thumb(f)}
							{#if src}
								<img class="thumb" {src} alt="" />
							{:else}
								<Icon name={isImage(f) ? 'image' : 'file'} size={18} />
							{/if}
						{/snippet}
						{#snippet children({ close })}
							<div class="detail">
								<Text variant="code" size="sm" class="detail-name">{f.name}</Text>
								{#if f.size !== undefined}<Text size="xs" tone="faint">{fmt(f.size)}</Text>{/if}
								{#if onremove}
									<Button
										size="sm"
										variant="danger"
										onclick={() => {
											close();
											onremove?.(i);
										}}
									>
										{removeLabel}
									</Button>
								{/if}
							</div>
						{/snippet}
					</Popover>
				</li>
			{/if}
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
	.attachments.auto {
		container-type: inline-size;
	}
	.size {
		margin-inline-start: var(--sp-1);
		color: var(--text-faint);
	}
	li {
		display: flex;
		min-width: 0;
	}
	.auto .tile {
		display: none;
	}
	@container (max-width: 30rem) {
		.auto .chip {
			display: none;
		}
		.auto .tile {
			display: flex;
		}
	}
	.thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: calc(var(--r-md) - 1px);
	}
	.detail {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--sp-1);
		padding: var(--sp-1);
		max-width: 16rem;
	}
	.detail :global(.detail-name) {
		overflow-wrap: anywhere;
	}
</style>
