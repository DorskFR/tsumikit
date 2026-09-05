<script lang="ts">
	// Theme switcher: the trigger shows the active theme's palette swatch and
	// opens a popover grid of swatches, light then dark. Each swatch is scoped
	// with data-theme so its four quadrants resolve that theme's raw palette
	// (--c-bg, --c-surface, --c-text, --c-accent; the derived --bg etc. are
	// resolved once at :root and would not re-scope). The root default theme
	// has no [data-theme] block, so its swatch carries the :root values.
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { type ThemeDef, theme } from '$lib/stores/theme.svelte';

	let { class: klass = '' }: { class?: string } = $props();

	let hovered = $state<ThemeDef | null>(null);
	const shown = $derived(hovered ?? theme.option);
	const groups = $derived(
		(['light', 'dark'] as const).map((mode) => ({
			mode,
			themes: theme.all.filter((t) => t.mode === mode)
		}))
	);
</script>

{#snippet swatch(id: string)}
	<span class="swatch" data-theme={id} aria-hidden="true">
		<i class="q bg"></i><i class="q surface"></i><i class="q text"></i><i class="q accent"></i>
	</span>
{/snippet}

<Popover label="Theme: {theme.label}" placement="bottom-end" triggerClass={klass} box="md">
	{#snippet trigger()}<span class="trigger" data-tsu="ThemePicker" title="Theme: {theme.label}">{@render swatch(theme.current)}</span>{/snippet}
	<div class="panel">
		{#each groups as g (g.mode)}
			<div class="group-label">{g.mode}</div>
			<div class="grid" role="group" aria-label="{g.mode} themes">
				{#each g.themes as t (t.id)}
					<button
						type="button"
						class="cell"
						class:current={t.id === theme.current}
						aria-pressed={t.id === theme.current}
						aria-label={t.label}
						title="{t.icon ?? theme.fallbackIcon} {t.label}"
						onclick={() => theme.set(t.id)}
						onpointerenter={() => (hovered = t)}
						onpointerleave={() => (hovered = null)}
						onfocus={() => (hovered = t)}
						onblur={() => (hovered = null)}
					>
						{@render swatch(t.id)}
					</button>
				{/each}
			</div>
		{/each}
		<div class="caption" aria-live="polite">{shown.icon ?? theme.fallbackIcon} {shown.label}</div>
	</div>
</Popover>

<style>
	.trigger {
		display: inline-flex;
	}
	.swatch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 1.25rem;
		height: 1.25rem;
		overflow: hidden;
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--border);
	}
	.swatch[data-theme='dark'] {
		--c-bg: #0f1115;
		--c-surface: #21262f;
		--c-text: #e6e9ef;
		--c-accent: #5ad6a0;
	}
	.q {
		display: block;
	}
	.q.bg {
		background: var(--c-bg);
	}
	.q.surface {
		background: var(--c-surface);
	}
	.q.text {
		background: var(--c-text);
	}
	.q.accent {
		background: var(--c-accent);
	}
	.panel {
		padding: var(--sp-2);
		width: max-content;
	}
	.group-label {
		margin: var(--sp-1) var(--sp-1) var(--sp-1);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(6, auto);
		gap: var(--sp-1);
	}
	.cell {
		display: inline-flex;
		padding: 3px;
		border: 2px solid transparent;
		border-radius: var(--r-md);
		background: none;
		cursor: pointer;
	}
	.cell .swatch {
		width: 1.6rem;
		height: 1.6rem;
	}
	.cell:hover {
		background: var(--bg-elevated-2);
	}
	.cell.current {
		border-color: var(--accent);
	}
	.cell:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.caption {
		margin-top: var(--sp-2);
		text-align: center;
		font-size: var(--fs-sm);
		color: var(--text-muted);
	}
</style>
