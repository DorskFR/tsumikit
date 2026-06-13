<script lang="ts">
	// Checkbox primitive. A real <input type="checkbox"> (keeps native keyboard,
	// form participation and a11y) with a token-styled box and an associated
	// label. Supports `bind:checked`, `indeterminate`, and passes through every
	// native attribute via `...rest`.
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		checked = $bindable(false),
		indeterminate = false,
		label,
		class: klass = '',
		el = $bindable(null),
		...rest
	}: HTMLInputAttributes & {
		checked?: boolean;
		indeterminate?: boolean;
		label: string;
		el?: HTMLInputElement | null;
	} = $props();

	// `indeterminate` is a property, not an attribute — sync it imperatively.
	$effect(() => {
		if (el) el.indeterminate = indeterminate;
	});
</script>

<label class="checkbox {klass}">
	<input bind:this={el} type="checkbox" bind:checked {...rest} />
	<span class="box" aria-hidden="true"></span>
	<span class="label-text">{label}</span>
</label>

<style>
	.checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		cursor: pointer;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	/* Visually hide the native control but keep it in the a11y tree + hit area. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		margin: 0;
	}
	.box {
		position: relative;
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		background: var(--bg);
		transition:
			background 0.12s var(--ease),
			border-color 0.12s var(--ease);
	}
	/* check mark */
	.box::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--text-on-accent);
		clip-path: polygon(41% 67%, 79% 26%, 87% 35%, 41% 84%, 15% 56%, 24% 47%);
		opacity: 0;
		transition: opacity 0.1s var(--ease);
	}
	input:checked + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	input:checked + .box::after {
		opacity: 1;
	}
	/* indeterminate dash */
	input:indeterminate + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	input:indeterminate + .box::after {
		opacity: 1;
		clip-path: polygon(22% 42%, 78% 42%, 78% 58%, 22% 58%);
	}
	input:focus-visible + .box {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	input:disabled ~ * {
		opacity: 0.45;
	}
	.checkbox:has(input:disabled) {
		cursor: not-allowed;
	}
</style>
