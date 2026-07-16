<script lang="ts">
	// Text input primitive. Owns its styling from theme tokens; supports
	// `bind:value` and passes through every native <input> attribute. `mono`
	// switches to the monospace family (paths, tokens, env values).
	import type { HTMLInputAttributes } from 'svelte/elements';

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
		class?: string;
		value?: HTMLInputAttributes['value'];
		el?: HTMLInputElement | null;
	};

	let {
		mono = false,
		size = 'md',
		grow = false,
		invalid = false,
		class: klass = '',
		value = $bindable(),
		el = $bindable(null),
		...rest
	}: Props = $props();
</script>

<input
	bind:this={el}
	data-tsu="Input"
	class="input {klass}"
	class:mono
	class:input-sm={size === 'sm'}
	class:input-grow={grow}
	bind:value
	{...rest}
	aria-invalid={invalid || undefined}
/>

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
	.input[aria-invalid='true'] {
		border-color: var(--danger);
	}
	.input[aria-invalid='true']:focus {
		border-color: var(--danger);
	}
	.mono {
		font-family: var(--font-mono);
	}
</style>
