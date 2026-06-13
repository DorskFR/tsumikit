<script lang="ts">
	// Inline label primitive — the project's single pill. Covers three jobs via
	// props rather than separate components:
	//   • state  → `tone` (neutral/ok/warn/danger/info) semantic palette
	//   • info   → `mono` for paths/ids/code-ish metadata
	//   • tag    → `removable` renders a dismiss button + fires `onremove`
	// Polymorphic via `as` so it can be a static <span> or an interactive
	// <button>. `size="sm"` is the compact form for counts/dense rows.
	import type { Snippet } from 'svelte';

	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	let {
		tone = 'neutral',
		as = 'span',
		size = 'md',
		mono = false,
		removable = false,
		onremove,
		class: klass = '',
		children,
		...rest
	}: {
		tone?: Tone;
		as?: 'span' | 'button';
		size?: 'sm' | 'md';
		mono?: boolean;
		removable?: boolean;
		onremove?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={as}
	class="badge {klass}"
	class:badge-ok={tone === 'ok'}
	class:badge-warn={tone === 'warn'}
	class:badge-danger={tone === 'danger'}
	class:badge-info={tone === 'info'}
	class:badge-sm={size === 'sm'}
	class:mono
	class:interactive={as === 'button'}
	{...rest}
>
	{@render children?.()}
	{#if removable}
		<button
			type="button"
			class="remove"
			aria-label="Remove"
			onclick={(e) => onremove?.(e)}
		>
			×
		</button>
	{/if}
</svelte:element>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
		padding: 0.15rem var(--sp-2);
		border-radius: var(--r-pill);
		font-size: var(--fs-xs);
		font-weight: var(--fw-medium);
		line-height: 1.4;
		background: var(--bg-elevated-2);
		color: var(--text-muted);
		border: 1px solid var(--border);
		white-space: nowrap;
		max-width: 100%;
	}
	.badge-sm {
		padding: 0 0.4rem;
		font-size: 0.6875rem;
		gap: 0.15rem;
	}
	.badge-ok {
		color: var(--ok);
		border-color: color-mix(in srgb, var(--ok) 40%, transparent);
		background: color-mix(in srgb, var(--ok) 12%, transparent);
	}
	.badge-warn {
		color: var(--warn);
		border-color: color-mix(in srgb, var(--warn) 40%, transparent);
		background: color-mix(in srgb, var(--warn) 12%, transparent);
	}
	.badge-danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 40%, transparent);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
	}
	.badge-info {
		color: var(--info);
		border-color: color-mix(in srgb, var(--info) 40%, transparent);
		background: color-mix(in srgb, var(--info) 12%, transparent);
	}
	.mono {
		font-family: var(--font-mono);
		font-weight: var(--fw-normal);
	}
	.interactive {
		cursor: pointer;
		transition:
			border-color 0.12s var(--ease),
			color 0.12s var(--ease);
	}
	.interactive:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}
	.remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 -0.15rem 0 0;
		padding: 0 0.1rem;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		line-height: 1;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.12s var(--ease);
	}
	.remove:hover {
		opacity: 1;
	}
</style>
