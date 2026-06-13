<script lang="ts">
	// File-picker button. A real <input type="file"> visually hidden inside a
	// <label> styled as a button — so it's keyboard-focusable and works with zero
	// JS to open the dialog. Emits the chosen files via `onfiles`. Dependency-free.
	import Icon from '$lib/components/atoms/Icon.svelte';
	import type { IconName } from '$lib/components/atoms/Icon.svelte';

	let {
		onfiles,
		label = 'Choose file',
		icon = 'upload',
		accept,
		multiple = false,
		disabled = false,
		variant = 'default',
		class: klass = ''
	}: {
		onfiles: (files: File[]) => void;
		label?: string;
		icon?: IconName;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		variant?: 'default' | 'primary' | 'ghost';
		class?: string;
	} = $props();

	function onchange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length) onfiles(files);
		input.value = ''; // allow re-picking the same file
	}
</script>

<label
	class="btn file-btn {klass}"
	class:btn-primary={variant === 'primary'}
	class:btn-ghost={variant === 'ghost'}
	class:disabled
>
	<input
		class="sr-only"
		type="file"
		{accept}
		{multiple}
		{disabled}
		onchange={onchange}
	/>
	<Icon name={icon} />
	<span>{label}</span>
</label>

<style>
	.file-btn {
		cursor: pointer;
	}
	/* The hidden input keeps focusability (sr-only, not display:none), so mirror
	   its focus onto the label for a visible ring. */
	.file-btn:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.file-btn.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
