<script lang="ts">
	// Text input primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native <input> attribute. `mono`
	// switches to the monospace family (paths, tokens, env values). A wrapper is
	// rendered only when `icon` / `clearable` are used, so the bare <input> DOM
	// stays as-is otherwise.
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon, { type IconName } from '$lib/components/atoms/Icon.svelte';

	// `size` shadows the native char-width attribute (unused in token-sized
	// layouts) to expose a height preset instead.
	type Props = Omit<HTMLInputAttributes, 'size'> & {
		mono?: boolean;
		size?: 'sm' | 'md';
		/** Fill the available width of a flex/Cluster row (flex: 1) instead of
		 *  needing a raw `style="flex:1"` at the call-site. */
		grow?: boolean;
		/** Error state: danger border + aria-invalid (also styles if a consumer
		 *  sets aria-invalid directly). */
		invalid?: boolean;
		/** Leading icon, inset inside the control. */
		icon?: IconName;
		/** Trailing clear (✕) button shown while the value is non-empty. */
		clearable?: boolean;
		onclear?: () => void;
		clearLabel?: string;
		shape?: 'square' | 'pill';
		/** Fixed width (also `flex: none` so flex rows don't stretch it). */
		width?: string;
		/** Fires with the current value on Enter. */
		onenter?: (value: string) => void;
		class?: string;
		value?: HTMLInputAttributes['value'];
		el?: HTMLInputElement | null;
	};

	let {
		mono = false,
		size = 'md',
		grow = false,
		invalid = false,
		icon,
		clearable = false,
		onclear,
		clearLabel = 'Clear',
		shape = 'square',
		width,
		onenter,
		onkeydown,
		class: klass = '',
		value = $bindable(),
		el = $bindable(null),
		...rest
	}: Props = $props();

	const wrapped = $derived(!!icon || clearable);

	function handleKeydown(e: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onkeydown?.(e);
		if (onenter && e.key === 'Enter' && !e.defaultPrevented) onenter(String(value ?? ''));
	}

	function clear() {
		value = '';
		onclear?.();
		el?.focus();
	}
</script>

{#snippet control()}
	<input
		bind:this={el}
		data-tsu="Input"
		class="input {klass}"
		class:mono
		class:input-sm={size === 'sm'}
		class:input-grow={grow}
		class:input-fixed={!!width && !wrapped}
		class:input-pill={shape === 'pill'}
		class:has-icon={!!icon}
		class:has-clear={clearable}
		style:width={wrapped ? undefined : width}
		bind:value
		{...rest}
		onkeydown={onenter || onkeydown ? handleKeydown : undefined}
		aria-invalid={invalid || undefined}
	/>
{/snippet}

{#if wrapped}
	<div
		class="input-wrap"
		data-part="wrap"
		class:input-grow={grow}
		class:input-fixed={!!width}
		style:width
	>
		{#if icon}<span class="input-icon"><Icon name={icon} /></span>{/if}
		{@render control()}
		{#if clearable && value}
			<button type="button" class="input-clear" aria-label={clearLabel} onclick={clear}>
				<Icon name="x" />
			</button>
		{/if}
	</div>
{:else}
	{@render control()}
{/if}

<style>
	.input {
		width: 100%;
		padding: var(--sp-3);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--r-md);
		color: var(--text);
		transition: border-color 0.12s var(--ease);
	}
	.input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.input-sm {
		padding: var(--sp-2);
		font-size: var(--fs-sm);
	}
	.input-grow {
		flex: 1 1 0;
		width: auto;
		min-width: 0;
	}
	.input-fixed {
		flex: none;
	}
	.input-pill {
		border-radius: var(--r-pill);
		padding-inline: var(--sp-4);
	}
	.input[aria-invalid='true'] {
		border-color: var(--danger);
	}
	.input[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	.mono {
		font-family: var(--font-mono);
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}
	.input-wrap .input {
		width: 100%;
	}
	.has-icon {
		padding-inline-start: calc(var(--sp-3) + 1em + var(--sp-2));
	}
	.has-clear {
		padding-inline-end: calc(var(--sp-3) + 1em + var(--sp-2));
	}
	.input-icon,
	.input-clear {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		color: var(--text-faint);
		pointer-events: none;
	}
	.input-icon {
		left: var(--sp-3);
	}
	.input-clear {
		right: var(--sp-2);
		pointer-events: auto;
		border: 0;
		background: transparent;
		padding: 0 var(--sp-1);
		cursor: pointer;
		border-radius: var(--r-sm);
	}
	.input-clear:hover,
	.input-clear:focus-visible {
		color: var(--text);
	}
</style>
