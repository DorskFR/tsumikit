<script lang="ts">
	// Theme switcher: the trigger shows the active theme's palette swatch and
	// opens a popover grid of swatches, light then dark. Each swatch is scoped
	// with data-theme so its four quadrants resolve that theme's raw palette
	// (--c-bg, --c-surface, --c-text, --c-accent; the derived --bg etc. are
	// resolved once at :root and would not re-scope). The root default theme
	// has no [data-theme] block, so its swatch carries the :root values.
	import type { ComponentProps } from 'svelte';
	import type { AnchorAttributes } from '$lib/anchor';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { type ThemeDef, theme } from '$lib/stores/theme.svelte';
	import { AUTO_THEME } from '$lib/theme-mode';

	type TriggerChrome = Pick<
		ComponentProps<typeof Popover>,
		'variant' | 'tone' | 'size' | 'box' | 'pill' | 'control' | 'block' | 'bare' | 'hitArea' | 'placement' | 'disabled'
	>;

	let {
		box = 'md',
		placement = 'bottom-end',
		variant,
		tone,
		size,
		pill,
		control,
		block,
		bare,
		hitArea,
		disabled,
		auto = false,
		autoLabel = 'Auto',
		autoHelp = 'Follow the system light/dark setting',
		lightLabel = 'Light',
		darkLabel = 'Dark',
		class: klass = '',
		style: styleProp = '',
		...rest
	}: AnchorAttributes & TriggerChrome & Own = $props();

	type Own = {
		/** Offer an "auto" row that follows `prefers-color-scheme`, remembering
		 *  one light and one dark theme. */
		auto?: boolean;
		autoLabel?: string;
		autoHelp?: string;
		lightLabel?: string;
		darkLabel?: string;
		class?: string;
		style?: string;
	};

	let hovered = $state<ThemeDef | null>(null);
	let hoveredAuto = $state(false);
	const isAuto = $derived(auto && theme.mode === AUTO_THEME);
	const shown = $derived(hovered ?? theme.option);
	const groups = $derived(
		(['light', 'dark'] as const).map((mode) => ({
			mode,
			label: mode === 'light' ? lightLabel : darkLabel,
			themes: theme.all.filter((t) => t.mode === mode),
		}))
	);
	const named = (id: string) => theme.all.find((t) => t.id === id)?.label ?? id;
	const autoCaption = $derived(`${autoLabel} · ${named(theme.pref.light)} / ${named(theme.pref.dark)}`);
	const title = $derived(isAuto ? `${autoLabel} · ${theme.label}` : `Theme: ${theme.label}`);
	const caption = $derived(
		hoveredAuto || (isAuto && !hovered)
			? autoCaption
			: `${shown.icon ?? theme.fallbackIcon} ${shown.label}`
	);
</script>

{#snippet swatch(id: string)}
	<span class="swatch" data-theme={id} aria-hidden="true">
		<i class="q bg"></i><i class="q surface"></i><i class="q text"></i><i class="q accent"></i>
	</span>
{/snippet}

<Popover
	{...rest}
	label={title}
	{placement}
	{box}
	{variant}
	{tone}
	{size}
	{pill}
	{control}
	{block}
	{bare}
	{hitArea}
	{disabled}
	triggerClass={klass}
	style={styleProp}
>
	{#snippet trigger()}<span class="trigger" data-tsu="ThemePicker" {title}>{@render swatch(theme.current)}{#if isAuto}<span class="auto-dot" aria-hidden="true">◐</span>{/if}</span>{/snippet}
	<div class="panel">
		{#each groups as g (g.mode)}
			<div class="group-label">{g.label}</div>
			<div class="grid" role="group" aria-label="{g.label} themes">
				{#each g.themes as t (t.id)}
					<button
						type="button"
						class="cell"
						class:current={!isAuto && t.id === theme.current}
						class:remembered={isAuto && t.id === theme.pref[g.mode]}
						aria-pressed={!isAuto && t.id === theme.current}
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
		{#if auto}
			<button
				type="button"
				class="auto"
				class:current={isAuto}
				aria-pressed={isAuto}
				title={autoCaption}
				onclick={() => theme.choose(AUTO_THEME)}
				onpointerenter={() => (hoveredAuto = true)}
				onpointerleave={() => (hoveredAuto = false)}
				onfocus={() => (hoveredAuto = true)}
				onblur={() => (hoveredAuto = false)}
			>
				<span class="auto-glyph" aria-hidden="true">◐</span>
				<span class="auto-text">
					<span class="auto-name">{autoLabel}</span>
					<span class="auto-help">{autoHelp}</span>
				</span>
				<span class="auto-pair" aria-hidden="true">
					{@render swatch(theme.pref.light)}
					<span class="slash">/</span>
					{@render swatch(theme.pref.dark)}
				</span>
			</button>
		{/if}
		<div class="caption" aria-live="polite">{caption}</div>
	</div>
</Popover>

<style>
	.trigger {
		position: relative;
		display: inline-flex;
	}
	.auto-dot {
		position: absolute;
		right: -0.35rem;
		bottom: -0.35rem;
		border-radius: 50%;
		background: var(--bg);
		color: var(--text-muted);
		font-size: var(--fs-xs);
		line-height: 1;
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
	.cell.remembered {
		border-color: var(--accent);
		border-style: dashed;
	}
	.cell:focus-visible,
	.auto:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.auto {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		width: 100%;
		margin-top: var(--sp-2);
		padding: var(--sp-1) var(--sp-2);
		border: 2px solid transparent;
		border-top: 1px solid var(--border);
		border-radius: var(--r-md);
		background: none;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.auto:hover {
		background: var(--bg-elevated-2);
	}
	.auto.current {
		border-color: var(--accent);
	}
	.auto-glyph {
		font-size: var(--fs-md);
		line-height: 1;
	}
	.auto-text {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
	}
	.auto-name {
		font-size: var(--fs-sm);
	}
	.auto-help {
		font-size: var(--fs-xs);
		color: var(--text-faint);
		white-space: normal;
	}
	.auto-pair {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-1);
	}
	.slash {
		color: var(--text-faint);
		font-size: var(--fs-xs);
	}
	.caption {
		margin-top: var(--sp-2);
		text-align: center;
		font-size: var(--fs-sm);
		color: var(--text-muted);
		white-space: normal;
	}
</style>
