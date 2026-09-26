<script lang="ts">
	// Chat composer: autoresizing Textarea with attach + send controls fused into
	// one InputGroup, submit shortcuts, prompt history on ↑/↓ at the text edges,
	// paste-to-attach and drag-over state. Attachments render above the field as
	// removable chips, or as tiles once the composer is narrow. `toolbarStart` /
	// `toolbarEnd` move attach + send into a row under the field.
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Textarea from '$lib/components/atoms/Textarea.svelte';
	import AttachmentList from '$lib/components/molecules/AttachmentList.svelte';
	import FileButton from '$lib/components/molecules/FileButton.svelte';
	import InputGroup from '$lib/components/molecules/InputGroup.svelte';

	let {
		value = $bindable(''),
		onsubmit,
		submitOn = 'auto',
		placeholder = 'Message…',
		history = [],
		attachments = $bindable([]),
		onfiles,
		onremove,
		accept,
		busy = false,
		disabled = false,
		maxHeight = '40vh',
		rows = 1,
		resize = 'none',
		sendLabel = 'Send',
		attachLabel = 'Attach',
		leading,
		trailing,
		toolbarStart,
		toolbarEnd,
		class: klass = '',
		style: styleProp = ''
	}: {
		value?: string;
		onsubmit: (value: string, files: File[]) => void;
		/** `auto`: Enter on fine pointers, mod+Enter on coarse ones. */
		submitOn?: 'enter' | 'mod-enter' | 'auto';
		placeholder?: string;
		/** Previous prompts, newest last; ↑/↓ browse them at the text edges. */
		history?: string[];
		attachments?: File[];
		onfiles?: (files: File[]) => void;
		onremove?: (index: number) => void;
		accept?: string;
		busy?: boolean;
		disabled?: boolean;
		maxHeight?: string;
		rows?: number;
		/** Manual drag handle on the top edge; `none` hides it. */
		resize?: 'none' | 'top';
		sendLabel?: string;
		attachLabel?: string;
		leading?: Snippet;
		trailing?: Snippet;
		/** Either one renders a row under the field: start slot left, end slot then send right. */
		toolbarStart?: Snippet;
		toolbarEnd?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let el = $state<HTMLTextAreaElement | null>(null);
	let dragging = $state(false);
	let cursor = $state(-1);
	let draft = '';

	const fine = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
	const mode = $derived(submitOn === 'auto' ? (fine() ? 'enter' : 'mod-enter') : submitOn);
	const canSend = $derived(!busy && !disabled && (value.trim().length > 0 || attachments.length > 0));
	const hasAttach = $derived(!!onfiles || accept !== undefined);
	const toolbar = $derived(!!toolbarStart || !!toolbarEnd);

	function submit() {
		if (!canSend) return;
		onsubmit(value, attachments);
		cursor = -1;
	}

	function addFiles(files: File[]) {
		if (!files.length) return;
		attachments = [...attachments, ...files];
		onfiles?.(files);
	}
	function removeAt(i: number) {
		attachments = attachments.filter((_, j) => j !== i);
		onremove?.(i);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.isComposing) {
			const mod = e.ctrlKey || e.metaKey;
			const submits = mode === 'enter' ? !e.shiftKey && !mod && !e.altKey : mod && !e.shiftKey;
			if (submits) {
				e.preventDefault();
				submit();
			}
			return;
		}
		if (!history.length || !el) return;
		const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
		const atEnd = el.selectionStart === value.length && el.selectionEnd === value.length;
		if (e.key === 'ArrowUp' && atStart) {
			if (cursor === -1) draft = value;
			const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
			cursor = next;
			value = history[next];
			e.preventDefault();
		} else if (e.key === 'ArrowDown' && atEnd && cursor !== -1) {
			const next = cursor + 1;
			if (next >= history.length) {
				cursor = -1;
				value = draft;
			} else {
				cursor = next;
				value = history[next];
			}
			e.preventDefault();
		}
	}

	function onpaste(e: ClipboardEvent) {
		const files = Array.from(e.clipboardData?.files ?? []);
		if (files.length) {
			e.preventDefault();
			addFiles(files);
		}
	}
	function ondrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		addFiles(Array.from(e.dataTransfer?.files ?? []));
	}
</script>

{#snippet startControls()}
	{#if leading}{@render leading()}{/if}
	{#if hasAttach}
		<FileButton onfiles={addFiles} {accept} multiple iconOnly label={attachLabel} variant="ghost" box="sm" {disabled} />
	{/if}
{/snippet}
{#snippet endControls()}
	{#if trailing}{@render trailing()}{/if}
	<Button variant="primary" box="sm" loading={busy} disabled={!canSend} aria-label={sendLabel} title={sendLabel} onclick={submit}>
		<span aria-hidden="true">➤</span>
	</Button>
{/snippet}

<div
	data-tsu="Composer"
	class="composer {klass}"
	class:dragging
	class:busy
	style={styleProp}
	role="group"
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	{ondrop}
>
	<AttachmentList files={attachments} onremove={removeAt} />
	<InputGroup
		align="end"
		{disabled}
		leading={!toolbar && (leading || hasAttach) ? startControls : undefined}
		trailing={toolbar ? undefined : endControls}
	>
		<Textarea
			bind:value
			bind:el
			autoresize
			{rows}
			{maxHeight}
			{placeholder}
			{resize}
			aria-label={placeholder}
			disabled={disabled || busy}
			{onkeydown}
			{onpaste}
		/>
	</InputGroup>
	{#if toolbar}
		<div class="toolbar">
			<div class="toolbar-start">
				{@render startControls()}
				{#if toolbarStart}{@render toolbarStart()}{/if}
			</div>
			<div class="toolbar-end">
				{#if toolbarEnd}{@render toolbarEnd()}{/if}
				{@render endControls()}
			</div>
		</div>
	{/if}
	<span class="hint">{mode === 'enter' ? 'Enter to send · Shift+Enter for a new line' : 'Ctrl/⌘+Enter to send'}</span>
</div>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
		border-radius: var(--r-lg);
	}
	.composer.dragging {
		outline: 2px dashed var(--accent);
		outline-offset: var(--sp-1);
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-2);
		min-width: 0;
	}
	.toolbar-start,
	.toolbar-end {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--sp-1);
		min-width: 0;
	}
	.toolbar-end {
		margin-inline-start: auto;
		justify-content: flex-end;
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
