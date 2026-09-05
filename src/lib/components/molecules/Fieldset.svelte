<script lang="ts">
	// Bordered zone whose legend rides the top border. Real <fieldset>/<legend>
	// for semantics. `droppable` turns it into an HTML5 drop target: a hovering
	// drag that passes `accepts` highlights the zone and shows `dropHint`;
	// `ondrop` receives the payload read from `dataTransfer` under `mime`.
	// Keyboard users cannot drag — the consumer must offer a non-drag path
	// (a move menu, a select) to the same action. Pointer-based DnD can drive
	// the highlight through the bindable `over` prop.
	import type { Snippet } from 'svelte';

	type Tone = 'accent' | 'neutral' | 'strong';

	let {
		legend,
		tone = 'accent',
		dashed = true,
		padding = 'md',
		droppable = false,
		mime = 'text/plain',
		accepts,
		ondrop,
		dropHint,
		over = $bindable(false),
		disabled = false,
		class: klass = '',
		style = '',
		children,
		...rest
	}: {
		legend?: string | Snippet;
		tone?: Tone;
		dashed?: boolean;
		padding?: 'sm' | 'md' | 'lg';
		droppable?: boolean;
		mime?: string;
		accepts?: (data: string, e: DragEvent) => boolean;
		ondrop?: (data: string, e: DragEvent) => void;
		dropHint?: string | Snippet;
		over?: boolean;
		disabled?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	let depth = 0;

	function payload(e: DragEvent): string {
		return e.dataTransfer?.getData(mime) ?? '';
	}
	function valid(e: DragEvent): boolean {
		if (!droppable || disabled) return false;
		if (!Array.from(e.dataTransfer?.types ?? []).includes(mime)) return false;
		return accepts ? accepts(payload(e), e) : true;
	}

	function onDragEnter(e: DragEvent) {
		if (!valid(e)) return;
		e.preventDefault();
		depth++;
		if (depth === 1) over = true;
	}
	function onDragLeave(e: DragEvent) {
		if (!droppable || disabled) return;
		depth = Math.max(0, depth - 1);
		if (depth === 0) over = false;
	}
	function onDragOver(e: DragEvent) {
		if (!valid(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}
	function onDrop(e: DragEvent) {
		depth = 0;
		over = false;
		if (!valid(e)) return;
		e.preventDefault();
		ondrop?.(payload(e), e);
	}
</script>

<fieldset
	class="fieldset fieldset-{tone} pad-{padding} {klass}"
	class:dashed
	class:droppable
	class:over
	class:disabled
	data-tsu="Fieldset"
	{style}
	ondragenter={onDragEnter}
	ondragleave={onDragLeave}
	ondragover={onDragOver}
	ondrop={onDrop}
	{...rest}
>
	{#if legend}
		<legend class="fieldset-legend">
			{#if typeof legend === 'string'}{legend}{:else}{@render legend()}{/if}
		</legend>
	{/if}
	{@render children?.()}
	{#if droppable && over && dropHint}
		<div class="fieldset-hint" aria-live="polite">
			{#if typeof dropHint === 'string'}{dropHint}{:else}{@render dropHint()}{/if}
		</div>
	{/if}
</fieldset>

<style>
	.fieldset {
		--fieldset-border: var(--accent-dim);
		--fieldset-pad: var(--sp-4);
		position: relative;
		min-width: 0;
		margin: 0;
		padding: calc(var(--fieldset-pad) + var(--sp-1)) var(--fieldset-pad) var(--fieldset-pad);
		border: 2px solid var(--fieldset-border);
		border-radius: var(--r-lg);
		background: var(--bg);
		transition:
			border-color 0.12s var(--ease),
			background 0.12s var(--ease);
	}
	.fieldset.dashed {
		border-style: dashed;
	}
	.fieldset-neutral {
		--fieldset-border: var(--border);
	}
	.fieldset-strong {
		--fieldset-border: var(--border-strong);
	}
	.pad-sm {
		--fieldset-pad: var(--sp-3);
	}
	.pad-lg {
		--fieldset-pad: var(--sp-6);
	}

	.fieldset-legend {
		position: absolute;
		top: -13px;
		left: 16px;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		max-width: calc(100% - 32px);
		padding: 0 8px;
		background: var(--bg);
		font-size: var(--fs-sm);
		font-weight: var(--fw-semibold);
		line-height: 1.5;
		color: var(--text);
	}

	.fieldset.over {
		--fieldset-border: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, var(--bg));
	}
	.fieldset.over .fieldset-legend {
		background: color-mix(in srgb, var(--accent) 6%, var(--bg));
	}
	.fieldset-hint {
		margin-top: var(--sp-3);
		padding: var(--sp-2) var(--sp-3);
		border: 1px dashed var(--accent);
		border-radius: var(--r-md);
		font-size: var(--fs-sm);
		color: var(--accent);
		text-align: center;
		pointer-events: none;
	}
	.fieldset.disabled {
		opacity: 0.6;
	}

	@media (prefers-reduced-motion: reduce) {
		.fieldset {
			transition: none;
		}
	}
</style>
