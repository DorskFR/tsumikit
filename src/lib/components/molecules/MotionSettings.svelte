<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Select from '$lib/components/atoms/Select.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { FX, FX_FAMILIES, type FxFamily, type FxSettings } from '$lib/fx';
	import { fx } from '$lib/stores/fx.svelte';

	type TriggerChrome = Pick<
		ComponentProps<typeof Popover>,
		'variant' | 'tone' | 'box' | 'pill' | 'control' | 'block' | 'bare' | 'hitArea' | 'placement' | 'disabled'
	>;

	let {
		families = FX_FAMILIES,
		size = 'md',
		box = size,
		placement = 'bottom-end',
		variant,
		tone,
		pill,
		control,
		block,
		bare,
		hitArea,
		disabled,
		label = 'Motion',
		resetLabel = 'Reset',
		reducedMotionHint = 'Your system asks for reduced motion: effects show their static fallback.',
		onchange,
		class: klass = '',
		style: styleProp = '',
	}: TriggerChrome & {
		/** Restrict and order the offered families. */
		families?: readonly FxFamily[];
		size?: 'sm' | 'md';
		label?: string;
		resetLabel?: string;
		reducedMotionHint?: string;
		onchange?: (settings: FxSettings) => void;
		class?: string;
		style?: string;
	} = $props();

	const uid = $props.id();
	let reduced = $state(false);

	$effect(() => {
		const mq = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
		if (!mq) return;
		reduced = mq.matches;
		const on = (e: MediaQueryListEvent) => (reduced = e.matches);
		mq.addEventListener?.('change', on);
		return () => mq.removeEventListener?.('change', on);
	});

	const offCount = $derived(families.filter((f) => fx.settings[f] === 'none').length);

	function pick(family: FxFamily, value: string) {
		fx.set(family, value);
		onchange?.(fx.settings);
	}
</script>

<Popover
	{label}
	{placement}
	{box}
	{variant}
	{tone}
	{pill}
	{control}
	{block}
	{bare}
	{hitArea}
	{disabled}
	triggerClass={klass}
	style={styleProp}
	sound={false}
>
	{#snippet trigger()}
		<span
			data-tsu="MotionSettings"
			class="glyph"
			title={offCount === families.length ? `${label}: off` : label}
		>
			<Icon name="zap" size={size === 'sm' ? 16 : 18} />
		</span>
	{/snippet}
	<div class="panel" class:panel-sm={size === 'sm'}>
		<div class="grid">
			{#each families as family (family)}
				<label class="name" for="{uid}-{family}">{FX[family].label}</label>
				<Select
					id="{uid}-{family}"
					size="sm"
					value={fx.settings[family]}
					options={FX[family].variants.map((v) => ({ value: v.id, label: v.label }))}
					onchange={(e) => pick(family, (e.currentTarget as HTMLSelectElement).value)}
				/>
			{/each}
		</div>
		<div class="row">
			{#if reduced}
				<div class="hint" aria-live="polite">{reducedMotionHint}</div>
			{/if}
			<Button
				size="sm"
				variant="ghost"
				class="reset"
				disabled={fx.isDefault}
				sound={false}
				onclick={() => {
					fx.reset();
					onchange?.(fx.settings);
				}}>{resetLabel}</Button
			>
		</div>
	</div>
</Popover>

<style>
	.glyph {
		display: inline-flex;
		line-height: var(--lh-none);
	}
	.panel {
		width: min(19rem, calc(100vw - var(--sp-6)));
		box-sizing: border-box;
		display: grid;
		gap: var(--sp-2);
		padding: var(--sp-3);
		font-size: 0.875rem;
		line-height: var(--lh-snug);
	}
	.panel-sm {
		width: min(17rem, calc(100vw - var(--sp-6)));
		padding: var(--sp-2) var(--sp-3);
		font-size: 0.8125rem;
	}
	.grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--sp-1) var(--sp-3);
	}
	.name {
		color: var(--text-muted);
		white-space: nowrap;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.row > :global(.reset) {
		margin-inline-start: auto;
	}
	.hint {
		flex: 1 1 0;
		min-width: 0;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
