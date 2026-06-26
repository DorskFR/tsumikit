<script lang="ts">
	// Drag-and-drop file area with a click/keyboard fallback to the file dialog.
	// Emits chosen/dropped files via `onfiles`. Filters by `accept` (extensions
	// or mime patterns). Dependency-free.
	//
	// Two modes:
	//  - Default (box): the whole zone is a labelled button so it's
	//    keyboard-operable, backed by a visually-hidden <input type=file>.
	//    Children, if passed, render inside the dashed box.
	//  - Overlay (`overlay`): wraps interactive content. Children render in
	//    normal flow (no box model, no click hijack); the dashed border + label
	//    paint as an absolutely-positioned layer only while a file is dragged
	//    over. Drop-only — the browse affordance stays on the host (e.g. a
	//    FileButton). Use this to make a whole surface/drawer/window a drop
	//    target.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		onfiles,
		onactive,
		accept,
		multiple = true,
		disabled = false,
		overlay = false,
		label = 'Drop files here',
		hint = 'or click to browse',
		children
	}: {
		onfiles: (files: File[]) => void;
		/** Fired when the drag-over (active) state changes — host can dim/highlight. */
		onactive?: (active: boolean) => void;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		/** Wrap interactive content; show the drop UI as an overlay only while dragging. */
		overlay?: boolean;
		label?: string;
		hint?: string;
		children?: Snippet;
	} = $props();

	let over = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	// Depth counter for robust enter/leave detection — dragenter/dragleave fire
	// for every child element the cursor crosses, so a naive boolean flickers.
	let depth = 0;

	function setOver(next: boolean) {
		if (over === next) return;
		over = next;
		onactive?.(next);
	}
	function hasFiles(e: DragEvent): boolean {
		return Array.from(e.dataTransfer?.types ?? []).includes('Files');
	}

	function accepted(files: File[]): File[] {
		if (!accept) return files;
		const pats = accept.split(',').map((s) => s.trim().toLowerCase());
		return files.filter((f) =>
			pats.some((p) =>
				p.startsWith('.')
					? f.name.toLowerCase().endsWith(p)
					: p.endsWith('/*')
						? f.type.toLowerCase().startsWith(p.slice(0, -1))
						: f.type.toLowerCase() === p
			)
		);
	}
	function emit(list: FileList | null | undefined) {
		let files = Array.from(list ?? []);
		files = accepted(files);
		if (!multiple) files = files.slice(0, 1);
		if (files.length) onfiles(files);
	}

	function onDragEnter(e: DragEvent) {
		if (disabled || !hasFiles(e)) return;
		depth++;
		if (depth === 1) setOver(true);
	}
	function onDragLeave(e: DragEvent) {
		if (disabled || !hasFiles(e)) return;
		depth = Math.max(0, depth - 1);
		if (depth === 0) setOver(false);
	}
	function onDragOver(e: DragEvent) {
		if (disabled) return;
		// preventDefault is required or `drop` never fires.
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		depth = 0;
		setOver(false);
		if (disabled) return;
		emit(e.dataTransfer?.files);
	}
</script>

{#if overlay}
	<div
		class="dz-host"
		data-tsu="Dropzone"
		class:over
		class:disabled
		role="presentation"
		ondragenter={onDragEnter}
		ondragleave={onDragLeave}
		ondragover={onDragOver}
		ondrop={onDrop}
	>
		{@render children?.()}
		{#if over}
			<div class="dz-overlay" aria-hidden="true">
				<Icon name="upload" size={28} />
				<span class="dz-label">{label}</span>
			</div>
		{/if}
	</div>
{:else}
	<div
		class="dz"
		data-tsu="Dropzone"
		class:over
		class:disabled
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-label="{label}. {hint}"
		aria-disabled={disabled || undefined}
		ondragenter={onDragEnter}
		ondragleave={onDragLeave}
		ondragover={onDragOver}
		ondrop={onDrop}
		onclick={() => !disabled && input?.click()}
		onkeydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
				e.preventDefault();
				input?.click();
			}
		}}
	>
		<input
			bind:this={input}
			class="sr-only"
			type="file"
			{accept}
			{multiple}
			{disabled}
			tabindex="-1"
			onchange={(e) => emit((e.currentTarget as HTMLInputElement).files)}
		/>
		{#if children}
			{@render children()}
		{:else}
			<Icon name="upload" size={28} />
			<span class="dz-label">{label}</span>
			<span class="dz-hint">{hint}</span>
		{/if}
	</div>
{/if}

<style>
	.dz {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		padding: var(--sp-8) var(--sp-4);
		text-align: center;
		color: var(--text-muted);
		background: var(--bg);
		border: 2px dashed var(--border-strong);
		border-radius: var(--r-lg);
		cursor: pointer;
		transition:
			border-color 0.12s var(--ease),
			background 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.dz:hover:not(.disabled),
	.dz:focus-visible {
		border-color: var(--accent);
		color: var(--text);
		outline: none;
	}
	.dz.over {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, var(--bg));
		color: var(--text);
	}
	.dz.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Overlay mode: don't impose a box model on the host layout. The wrapper is
	   a positioning context for the absolute overlay; otherwise it passes
	   through (full size, transparent). */
	.dz-host {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
		width: 100%;
		height: 100%;
	}
	.dz-overlay {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-2);
		text-align: center;
		color: var(--text);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border: 2px dashed var(--accent);
		border-radius: var(--r-lg);
		pointer-events: none;
		backdrop-filter: blur(1px);
	}

	.dz-label {
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
	}
	.dz-hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
