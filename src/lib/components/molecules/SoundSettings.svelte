<script lang="ts">
	// Opt-in UI sound control: a speaker trigger opens a popover with the
	// on/off switch, a volume slider (disabled while off), a preview button and
	// the reason nothing plays (off, or reduced motion muting decorative sounds).
	import type { ComponentProps } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Icon from '$lib/components/atoms/Icon.svelte';
	import Slider from '$lib/components/atoms/Slider.svelte';
	import Switch from '$lib/components/atoms/Switch.svelte';
	import Popover from '$lib/components/molecules/Popover.svelte';
	import { sound } from '$lib/stores/sound.svelte';

	type TriggerChrome = Pick<
		ComponentProps<typeof Popover>,
		'variant' | 'tone' | 'box' | 'pill' | 'control' | 'block' | 'bare' | 'hitArea' | 'placement' | 'disabled'
	>;

	let {
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
		label = 'Sound',
		switchLabel = 'Sound effects',
		volumeLabel = 'Volume',
		previewLabel = 'Preview',
		offHint = 'Off. Nothing is loaded until you turn it on.',
		reducedMotionHint = 'Decorative sounds are muted because your system asks for reduced motion.',
		class: klass = '',
		style: styleProp = '',
	}: TriggerChrome & {
		size?: 'sm' | 'md';
		label?: string;
		switchLabel?: string;
		volumeLabel?: string;
		previewLabel?: string;
		offHint?: string;
		reducedMotionHint?: string;
		class?: string;
		style?: string;
	} = $props();

	const icon = $derived(
		!sound.enabled || sound.volume === 0 ? 'volume-off' : sound.volume < 0.5 ? 'volume-low' : 'volume-high'
	);
	const percent = $derived(Math.round(sound.volume * 100));
	const hint = $derived(
		sound.muted === 'off' ? offHint : sound.muted === 'reduced-motion' ? reducedMotionHint : null
	);
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
		<span data-tsu="SoundSettings" class="glyph" title="{label}: {sound.enabled ? `${percent}%` : 'off'}">
			<Icon name={icon} size={size === 'sm' ? 16 : 18} />
		</span>
	{/snippet}
	<div class="panel" class:panel-sm={size === 'sm'}>
		<div class="row">
			<Switch
				label={switchLabel}
				labelVisible
				size={size === 'sm' ? 'sm' : 'md'}
				bind:checked={() => sound.enabled, (on) => sound.setEnabled(on)}
			/>
			<Button
				size="sm"
				variant="ghost"
				disabled={!sound.enabled}
				sound={false}
				onclick={() => sound.play('success')}>{previewLabel}</Button
			>
		</div>
		<div class="row">
			<Icon name="volume" size={16} />
			<Slider
				value={sound.volume}
				min={0}
				max={1}
				step={0.05}
				label={volumeLabel}
				aria-valuetext="{percent}%"
				disabled={!sound.enabled}
				oninput={(e) => sound.setVolume(Number((e.currentTarget as HTMLInputElement).value))}
			/>
			<span class="value">{percent}%</span>
		</div>
		{#if hint}
			<div class="hint" aria-live="polite">{hint}</div>
		{/if}
	</div>
</Popover>

<style>
	.glyph {
		display: inline-flex;
		line-height: var(--lh-none);
	}
	.panel {
		width: min(17rem, calc(100vw - var(--sp-6)));
		box-sizing: border-box;
		display: grid;
		gap: var(--sp-2);
		padding: var(--sp-3);
		font-size: 0.875rem;
		line-height: var(--lh-snug);
	}
	.panel-sm {
		width: min(15rem, calc(100vw - var(--sp-6)));
		padding: var(--sp-2) var(--sp-3);
		font-size: 0.8125rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		min-width: 0;
		color: var(--text-muted);
	}
	.row > :global(.switch-row) {
		flex: 1 1 auto;
		color: var(--text);
	}
	.row > :global(.slider) {
		flex: 1 1 0;
		min-width: 0;
	}
	.value {
		flex: none;
		min-width: 2.5rem;
		text-align: end;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
