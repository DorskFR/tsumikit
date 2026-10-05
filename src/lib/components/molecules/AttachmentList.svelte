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
		onopen,
		tiles = 'auto',
		numbered = false,
		removeLabel = 'Remove',
		openLabel = 'Open',
		class: klass = '',
		style: styleProp = ''
	}: {
		files: (File | Attachment)[];
		onremove?: (index: number) => void;
		/** Makes the chip name a button and adds a preview + Open action to the tile popover. */
		onopen?: (index: number) => void;
		/** `auto` switches to tiles when the list is at most 30rem wide. */
		tiles?: boolean | 'auto';
		/** Shows each file's 1-based position, matching `[#N]` markers in a prompt. */
		numbered?: boolean;
		removeLabel?: string;
		openLabel?: string;
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

	const TAIL = 12;

	/** Chips clip the head and keep the tail, where look-alike names (macOS
	 *  screenshots) differ. */
	function split(name: string): [string, string] {
		const chars = [...name];
		if (chars.length <= TAIL + 4) return [name, ''];
		return [chars.slice(0, -TAIL).join(''), chars.slice(-TAIL).join('')];
	}

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
			{#snippet label(f: File | Attachment)}
				{@const [head, tail] = split(f.name)}
				<span class="head">{head}</span>{#if tail}<span class="tail">{tail}</span>{/if}
				{#if f.size !== undefined}<span class="size">{fmt(f.size)}</span>{/if}
			{/snippet}
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
						{@const src = thumb(f)}
						{#if numbered}<span class="num">{i + 1}</span>{/if}
						{#if src}<img class="mini" {src} alt="" />{/if}
						{#if onopen}
							<button type="button" class="open" title={openLabel} onclick={() => onopen?.(i)}>
								{@render label(f)}
							</button>
						{:else}
							<span class="name">{@render label(f)}</span>
						{/if}
					</Badge>
				</li>
			{/if}
			{#if tiles !== false}
				<li class="tile">
					<Popover label={numbered ? `${i + 1}. ${f.name}` : f.name} box="lg" placement="top-start" style="--pop-trigger-pad: 0; --pop-trigger-border: var(--border-strong); --pop-trigger-bg: var(--bg)">
						{#snippet trigger()}
							{@const src = thumb(f)}
							<span class="face">
								{#if src}
									<img class="thumb" {src} alt="" />
								{:else}
									<Icon name={isImage(f) ? 'image' : 'file'} size={18} />
								{/if}
								{#if numbered}<span class="num tile-num">{i + 1}</span>{/if}
							</span>
						{/snippet}
						{#snippet children({ close })}
							<div class="detail">
								<div class="detail-head">
									<Text variant="code" size="sm" class="detail-name">{f.name}</Text>
									{#if onremove}
										<Button
											variant="ghost"
											box="sm"
											hoverDanger
											aria-label={removeLabel}
											title={removeLabel}
											onclick={() => {
												close();
												onremove?.(i);
											}}
										>
											<Icon name="trash" size={16} />
										</Button>
									{/if}
								</div>
								{#if f.size !== undefined}<Text size="xs" tone="faint">{fmt(f.size)}</Text>{/if}
								{#if onopen}
									{@const src = thumb(f)}
									{#if src}
										<button
											type="button"
											class="preview"
											title={openLabel}
											onclick={() => {
												close();
												onopen?.(i);
											}}
										>
											<img {src} alt="" />
										</button>
									{/if}
									<Button
										size="sm"
										onclick={() => {
											close();
											onopen?.(i);
										}}
									>
										{openLabel}
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
	.detail-head {
		display: flex;
		align-items: flex-start;
		gap: var(--sp-2);
		width: 100%;
	}
	.detail-head > :global(button) {
		flex: none;
		margin-inline-start: auto;
	}
	.detail :global(.detail-name) {
		overflow-wrap: anywhere;
	}
	.chip :global(.action) {
		font-size: 1.4em;
	}
	.chip :global(.clip) {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	.name,
	.open {
		display: inline-flex;
		align-items: baseline;
		min-width: 0;
		white-space: nowrap;
	}
	.head {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tail,
	.size {
		flex: none;
	}
	.open {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.open:hover {
		text-decoration: underline;
	}
	.open:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		border-radius: var(--r-sm);
	}
	.mini {
		flex: none;
		width: 1.25em;
		height: 1.25em;
		object-fit: cover;
		border-radius: var(--r-sm);
	}
	.num {
		flex: none;
		font-size: 0.8em;
		font-weight: 600;
		line-height: 1;
		color: var(--text-muted);
	}
	.face {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	.tile-num {
		position: absolute;
		top: -0.35em;
		right: -0.35em;
		min-width: 1.4em;
		padding: 0.1em 0.3em;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-pill);
		background: var(--bg);
		color: var(--text);
		text-align: center;
	}
	.preview {
		display: block;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: none;
		cursor: pointer;
		overflow: hidden;
		line-height: 0;
	}
	.preview:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.preview img {
		display: block;
		max-width: 16rem;
		max-height: 16rem;
		object-fit: contain;
	}
</style>
