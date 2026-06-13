<script lang="ts">
	// Drag-and-drop file area with a click/keyboard fallback to the file dialog.
	// Emits chosen/dropped files via `onfiles`. Filters by `accept` (extensions
	// or mime patterns). Dependency-free; the whole zone is a labelled button so
	// it's keyboard-operable, and a visually-hidden <input type=file> backs it.
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';

	let {
		onfiles,
		accept,
		multiple = true,
		disabled = false,
		label = 'Drop files here',
		hint = 'or click to browse',
		children
	}: {
		onfiles: (files: File[]) => void;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		label?: string;
		hint?: string;
		children?: Snippet;
	} = $props();

	let over = $state(false);
	let input = $state<HTMLInputElement | null>(null);

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
	function onDrop(e: DragEvent) {
		e.preventDefault();
		over = false;
		if (disabled) return;
		emit(e.dataTransfer?.files);
	}
</script>

<div
	class="dz"
	class:over
	class:disabled
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label="{label}. {hint}"
	aria-disabled={disabled || undefined}
	ondragover={(e) => {
		e.preventDefault();
		if (!disabled) over = true;
	}}
	ondragleave={() => (over = false)}
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
	.dz-label {
		font-weight: var(--fw-medium);
		font-size: var(--fs-sm);
	}
	.dz-hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
