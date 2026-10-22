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
		shrink = true,
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
		/** `false` pins the field (`flex: none`) in a row. */
		shrink?: boolean;
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

<div class="field {klass}" class:field-grow={grow} class:field-no-shrink={!shrink} class:field-inline={layout === 'inline'} data-tsu="Field">
	{#if label}
		<label class="label" for={forId} style:width={labelWidth}><span class="label-text">{label}</span></label>
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
		min-width: 0;
	}
	.field-grow {
		flex: 1 1 0;
		min-width: 0;
	}
	.field-no-shrink {
		flex: none;
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

	/* Spring label: over a md text field the label rests inside the control and
	   springs into its top edge on focus or once filled. */
	:global([data-fx-focus='label']) .field:not(.field-inline):not(:global([data-fx-focus='label'] [data-fx-focus]:not([data-fx-focus='label'])) *):has(> .label + :global(input.input:not(.input-sm, .input-lg, .grouped)), > .label + :global(.textarea-wrap:not(.grouped) > .textarea:not(.textarea-sm, .textarea-lg))) {
		--float-h: 3.25rem;
		position: relative;
		& > .label {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			z-index: 1;
			display: flex;
			align-items: center;
			max-width: 100%;
			height: var(--float-h);
			padding-inline: calc(var(--control-px-md) + var(--edge-width));
			font-size: var(--control-fs-md);
			pointer-events: none;
		}
		& .label-text {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			line-height: var(--lh-none);
			transform-origin: left center;
			transition-property: translate, scale, color;
			transition-duration: var(--dur-spring), var(--dur-spring), var(--dur-fast);
			transition-timing-function: var(--ease-spring-bounce), var(--ease-spring-bounce), ease;
		}
		& :global(:is(.input, .textarea)) {
			min-height: var(--float-h);
			padding-top: 1.35rem;
			padding-bottom: 0.4rem;
		}
		& :global(:is(.input, .textarea):not(:focus)::placeholder) {
			color: transparent;
		}
		& :global(:is(.input, .textarea):focus) {
			animation: none;
			box-shadow:
				var(--control-shadow),
				inset 0 -1px 0 var(--focus-tint);
		}
		&:has(:global(:is(.input, .textarea):is(:focus, :not(:placeholder-shown), :autofill))) .label-text {
			translate: 0 -0.7rem;
			scale: 0.78;
		}
		&:has(:global(:is(.input, .textarea):focus)) > .label {
			color: var(--accent);
		}
		&:has(:global([aria-invalid='true'])) > .label {
			color: var(--danger);
		}
	}
</style>
