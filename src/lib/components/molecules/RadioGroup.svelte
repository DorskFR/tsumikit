<script lang="ts" module>
	export interface RadioOption {
		value: string;
		label: string;
		hint?: string;
		/** Secondary text under the label, announced via `aria-describedby`. */
		description?: string;
		note?: string;
		disabled?: boolean;
		/** `swatch` variant: any CSS colour (or var()). */
		color?: string;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { playSound } from '$lib/sound';

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
		onfocuschange,
		sound = true,
		class: klass = ''
	}: {
		options: RadioOption[];
		value?: string;
		name?: string;
		label: string;
		/** `swatch` renders each option as a colour chip with the label as its name. */
		variant?: 'list' | 'rows' | 'swatch';
		action?: Snippet<[RadioOption]>;
		below?: Snippet<[RadioOption]>;
		/** Fires once each time a different option becomes active — by keyboard
		 *  focus or by pointer hover — so a consumer can drive a preview pane. */
		onfocuschange?: (value: string) => void;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		class?: string;
	} = $props();

	const uid = $props.id();
	const descId = (o: RadioOption) => (o.description ? `${uid}-${o.value}-desc` : undefined);

	let active: string | undefined;
	function activate(v: string) {
		if (v === active) return;
		active = v;
		onfocuschange?.(v);
	}
	const onchange = () => playSound('click', sound);
</script>

<div
	role="radiogroup"
	aria-label={label}
	class="radio-group {klass}"
	class:rows={variant === 'rows'}
	class:swatches={variant === 'swatch'}
	data-tsu="RadioGroup"
	data-variant={variant}
>
	{#each options as o (o.value)}
		{#if variant === 'swatch'}
			<label class="swatch" class:disabled={o.disabled} title={o.label} onpointerenter={() => activate(o.value)}>
				<input
					type="radio"
					{name}
					value={o.value}
					bind:group={value}
					disabled={o.disabled}
					aria-label={o.label}
					aria-describedby={descId(o)}
					onfocus={() => activate(o.value)}
					{onchange}
				/>
				{#if o.description}<span class="sr-only" id={descId(o)}>{o.description}</span>{/if}
				<span class="swatch-chip" aria-hidden="true" style="--swatch: {o.color ?? 'var(--accent)'}"></span>
			</label>
		{:else if variant === 'rows'}
			<div class="row-wrap">
				<div class="row" class:selected={o.value === value} class:disabled={o.disabled}>
					<label class="radio" onpointerenter={() => activate(o.value)}>
						<input
							type="radio"
							{name}
							value={o.value}
							bind:group={value}
							disabled={o.disabled}
							aria-describedby={descId(o)}
							onfocus={() => activate(o.value)}
							{onchange}
						/>
						<span class="dot-ctl" aria-hidden="true"></span>
						<span class="texts">
							<span class="label-line">
								<span class="label-text">{o.label}</span>
								{#if o.note}<span class="note">{o.note}</span>{/if}
							</span>
							{#if o.description}<span class="description" id={descId(o)}>{o.description}</span>{/if}
							{#if o.hint}<span class="hint">{o.hint}</span>{/if}
						</span>
					</label>
					{#if action}<span class="action">{@render action(o)}</span>{/if}
				</div>
				{#if below}<div class="below">{@render below(o)}</div>{/if}
			</div>
		{:else}
			<label class="radio" class:disabled={o.disabled} onpointerenter={() => activate(o.value)}>
				<input
					type="radio"
					{name}
					value={o.value}
					bind:group={value}
					disabled={o.disabled}
					aria-describedby={descId(o)}
					onfocus={() => activate(o.value)}
					{onchange}
				/>
				<span class="dot-ctl" aria-hidden="true"></span>
				<span class="texts">
					<span class="label-text">{o.label}</span>
					{#if o.description}<span class="description" id={descId(o)}>{o.description}</span>{/if}
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
		opacity: var(--disabled-opacity);
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
		width: var(--chip-sm);
		height: var(--chip-sm);
		margin-top: var(--sp-px);
		border: var(--edge-width) solid var(--control-edge);
		border-radius: var(--r-pill);
		background: var(--control-fill);
		box-shadow: var(--control-shadow);
		transition: border-color var(--dur-fast) var(--ease);
	}
	.dot-ctl::after {
		content: '';
		position: absolute;
		inset: 0;
		width: var(--sp-2);
		height: var(--sp-2);
		margin: auto;
		border-radius: var(--r-pill);
		background: var(--accent);
		opacity: 0;
		scale: 0.5;
		transition:
			opacity var(--dur-exit-fast) var(--ease-out),
			scale var(--dur-exit-fast) var(--ease-out);
	}
	input:checked + .dot-ctl {
		border-color: var(--accent);
	}
	input:checked + .dot-ctl::after {
		opacity: 1;
		scale: 1;
		transition:
			opacity var(--dur-spring) var(--ease-spring),
			scale var(--dur-spring) var(--ease-spring);
	}
	input:focus-visible + .dot-ctl {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		box-shadow: var(--control-shadow), var(--focus-glow);
	}
	.texts {
		display: flex;
		flex-direction: column;
		gap: var(--sp-px);
		min-width: 0;
	}
	.hint {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}

	.rows {
		gap: var(--sp-1);
		min-width: 0;
	}
	.row-wrap {
		min-width: 0;
	}
	.row {
		width: 100%;
		display: flex;
		align-items: flex-start;
		min-width: 0;
		gap: var(--sp-2);
		padding: var(--pad, var(--sp-2) var(--sp-3));
		border: var(--edge-width) solid var(--surface-edge);
		border-radius: var(--r-md);
		transition:
			border-color var(--dur-fast) var(--ease),
			background-color var(--dur-fast) var(--ease);
	}
	.row.selected {
		border-color: var(--accent-dim);
		background: var(--surface-fill);
	}
	.row .radio {
		flex: 1 1 auto;
		min-width: 0;
	}
	.row .texts {
		flex: 1 1 auto;
		min-width: 0;
	}
	.label-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--sp-px) var(--sp-2);
		min-width: 0;
	}
	.row .label-text {
		font-weight: var(--fw-semibold);
	}
	.note {
		font-size: var(--fs-xs);
		color: var(--text-faint);
	}
	.description {
		font-size: var(--fs-xs);
		color: var(--text-muted);
	}
	.row .description {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
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
	.swatches {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--sp-2);
	}
	.swatch {
		position: relative;
		display: inline-flex;
		cursor: pointer;
	}
	.swatch.disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.swatch-chip {
		width: var(--chip-md);
		height: var(--chip-md);
		border-radius: var(--r-pill);
		background: var(--swatch);
		border: 2px solid transparent;
		box-shadow: 0 0 0 1px var(--border-strong);
		transition: box-shadow var(--dur-fast) var(--ease);
	}
	.swatch input:checked + .swatch-chip {
		border-color: var(--bg);
		box-shadow: 0 0 0 2px var(--accent);
	}
	.swatch input:focus-visible + .swatch-chip {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
</style>
