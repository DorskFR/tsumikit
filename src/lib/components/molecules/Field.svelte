<script lang="ts">
	// Form field wrapper: a label above a slotted control, with optional hint and
	// error text. Replaces the ad-hoc `<div class="field"><label class="label">`
	// markup. The label is a real <label for>; when `for` is omitted a generated
	// id is published via field context so the slotted control adopts it (plus
	// aria-describedby for hint/error and aria-invalid) automatically.
	// `layout="inline"` puts the label beside the control (fixed `labelWidth`
	// aligns a column of them); hint/error then follow the control on the row.
	import type { Snippet } from 'svelte';
	import { setFieldContext } from '$lib/field-context';

	let {
		label,
		for: forProp,
		hint,
		error,
		layout = 'stack',
		labelWidth,
		grow = false,
		class: klass = '',
		children
	}: {
		label?: string;
		for?: string;
		hint?: string | Snippet;
		error?: string;
		layout?: 'stack' | 'inline';
		/** Inline layout: fixed label column width. */
		labelWidth?: string;
		/** Fill the available width of a flex/Cluster row (flex: 1). */
		grow?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	const uid = $props.id();
	const forId = $derived(forProp ?? uid);
	const hintId = $derived(`${forId}-hint`);
	const errorId = $derived(`${forId}-err`);
	const describedBy = $derived(
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	setFieldContext({
		get id() {
			return forId;
		},
		get describedBy() {
			return describedBy;
		},
		get invalid() {
			return !!error;
		}
	});
</script>

<div class="field {klass}" class:field-grow={grow} class:field-inline={layout === 'inline'} data-tsu="Field">
	{#if label}
		<label class="label" for={forId} style:width={labelWidth}>{label}</label>
	{/if}
	{@render children?.()}
	{#if hint}
		<span class="hint" id={hintId}>{#if typeof hint === 'function'}{@render hint()}{:else}{hint}{/if}</span>
	{/if}
	{#if error}<span class="error" id={errorId}>{error}</span>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
	}
	.field-grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.field-inline {
		flex-direction: row;
		align-items: center;
		gap: var(--sp-2);
	}
	.field-inline .label {
		flex: none;
	}
	.label {
		font-size: var(--fs-sm);
		font-weight: var(--fw-medium);
		color: var(--text-muted);
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.error {
		font-size: var(--fs-xs);
		color: var(--danger);
	}
</style>
