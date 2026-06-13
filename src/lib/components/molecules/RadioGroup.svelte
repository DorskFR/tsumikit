<script lang="ts" module>
	export interface RadioOption {
		value: string;
		label: string;
		hint?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	// Radio group built on native <input type="radio"> sharing one `name`, so the
	// browser handles single-selection, arrow-key navigation and form
	// participation. Wrapped in a labelled `radiogroup` with token-styled dots.
	// `value` is bindable.
	let {
		options,
		value = $bindable(),
		name = `radio-${Math.random().toString(36).slice(2, 8)}`,
		label,
		class: klass = ''
	}: {
		options: RadioOption[];
		value?: string;
		name?: string;
		label: string;
		class?: string;
	} = $props();
</script>

<div role="radiogroup" aria-label={label} class="radio-group {klass}">
	{#each options as o (o.value)}
		<label class="radio" class:disabled={o.disabled}>
			<input type="radio" {name} value={o.value} bind:group={value} disabled={o.disabled} />
			<span class="dot-ctl" aria-hidden="true"></span>
			<span class="texts">
				<span class="label-text">{o.label}</span>
				{#if o.hint}<span class="hint">{o.hint}</span>{/if}
			</span>
		</label>
	{/each}
</div>

<style>
	.radio-group {
		display: flex;
		flex-direction: column;
		gap: var(--sp-2);
	}
	.radio {
		display: flex;
		align-items: flex-start;
		gap: var(--sp-2);
		cursor: pointer;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	.radio.disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		margin: 0;
	}
	.dot-ctl {
		position: relative;
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		margin-top: 0.1rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-pill);
		background: var(--bg);
		transition: border-color 0.12s var(--ease);
	}
	.dot-ctl::after {
		content: '';
		position: absolute;
		inset: 50%;
		width: 0.55rem;
		height: 0.55rem;
		margin: -0.275rem 0 0 -0.275rem;
		border-radius: var(--r-pill);
		background: var(--accent);
		transform: scale(0);
		transition: transform 0.1s var(--ease);
	}
	input:checked + .dot-ctl {
		border-color: var(--accent);
	}
	input:checked + .dot-ctl::after {
		transform: scale(1);
	}
	input:focus-visible + .dot-ctl {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.texts {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
</style>
