<script lang="ts" module>
	export interface RadioOption {
		value: string;
		label: string;
		hint?: string;
		description?: string;
		note?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	// Native <input type="radio"> sharing one `name`: the browser handles
	// single-selection, arrow keys and form participation. `variant="rows"`
	// turns each option into a bordered row with optional trailing `action`
	// (outside the label, so clicking it never toggles) and a `below` panel.
	let {
		options,
		value = $bindable(),
		name = `radio-${Math.random().toString(36).slice(2, 8)}`,
		label,
		variant = 'list',
		action,
		below,
		class: klass = ''
	}: {
		options: RadioOption[];
		value?: string;
		name?: string;
		label: string;
		variant?: 'list' | 'rows';
		action?: Snippet<[RadioOption]>;
		below?: Snippet<[RadioOption]>;
		class?: string;
	} = $props();
</script>

<div
	role="radiogroup"
	aria-label={label}
	class="radio-group {klass}"
	class:rows={variant === 'rows'}
	data-tsu="RadioGroup"
	data-variant={variant}
>
	{#each options as o (o.value)}
		{#if variant === 'rows'}
			<div class="row-wrap">
				<div class="row" class:selected={o.value === value} class:disabled={o.disabled}>
					<label class="radio">
						<input type="radio" {name} value={o.value} bind:group={value} disabled={o.disabled} />
						<span class="dot-ctl" aria-hidden="true"></span>
						<span class="texts">
							<span class="label-line">
								<span class="label-text">{o.label}</span>
								{#if o.note}<span class="note">{o.note}</span>{/if}
							</span>
							{#if o.description}<span class="description">{o.description}</span>{/if}
							{#if o.hint}<span class="hint">{o.hint}</span>{/if}
						</span>
					</label>
					{#if action}<span class="action">{@render action(o)}</span>{/if}
				</div>
				{#if below}<div class="below">{@render below(o)}</div>{/if}
			</div>
		{:else}
			<label class="radio" class:disabled={o.disabled}>
				<input type="radio" {name} value={o.value} bind:group={value} disabled={o.disabled} />
				<span class="dot-ctl" aria-hidden="true"></span>
				<span class="texts">
					<span class="label-text">{o.label}</span>
					{#if o.hint}<span class="hint">{o.hint}</span>{/if}
				</span>
			</label>
		{/if}
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
	.radio.disabled,
	.row.disabled .radio {
		cursor: not-allowed;
	}
	.radio.disabled,
	.row.disabled {
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
		min-width: 0;
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}

	.rows {
		gap: var(--sp-1);
	}
	.row-wrap {
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: flex-start;
		gap: var(--sp-2);
		padding: var(--pad, var(--sp-2) var(--sp-3));
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		transition:
			border-color 0.12s var(--ease),
			background-color 0.12s var(--ease);
	}
	.row.selected {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
	}
	.row .radio {
		flex: 1 1 auto;
		min-width: 0;
	}
	.row .texts {
		flex: 1 1 auto;
	}
	.label-line {
		display: flex;
		align-items: baseline;
		gap: var(--sp-2);
		min-width: 0;
	}
	.row .label-text {
		font-weight: 600;
	}
	.note {
		font-size: var(--fs-xs);
		color: var(--text-faint);
		white-space: nowrap;
	}
	.description {
		font-size: var(--fs-xs);
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.action {
		flex: none;
		margin-left: auto;
		display: flex;
		align-items: center;
	}
	.below {
		padding: var(--sp-2) 0 0 var(--sp-3);
	}
	.below:empty {
		display: none;
	}
</style>
